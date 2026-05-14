from datetime import date, timedelta

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.authentication import CookieJWTAuthentication
from users.permissions import IsAuthenticated, IsAdminUser
from .models import BorrowedBook, BorrowStatus
from .serializers import BorrowSerializer

DEFAULT_BORROW_DAYS = 14


class BorrowView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAuthenticated]

    def post(self, request):
        data       = {**request.data, "user": request.user.pk}
        serializer = BorrowSerializer(data=data)
        if serializer.is_valid():
            borrow = serializer.save()
            return Response(BorrowSerializer(borrow).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        borrows    = BorrowedBook.objects.get_borrows_by_user(request.user.pk)
        serializer = BorrowSerializer(borrows, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BorrowAdminView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]

    def get(self, request, user_id=None):
        if user_id is not None:
            borrows = BorrowedBook.objects.get_borrows_by_user(user_id)
        else:
            borrows = BorrowedBook.objects.all().select_related("book", "user")
        return Response(BorrowSerializer(borrows, many=True).data, status=status.HTTP_200_OK)


class BorrowPendingView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]

    def get(self, request):
        borrows = BorrowedBook.objects.get_pending_borrows().select_related("book", "user")
        return Response(BorrowSerializer(borrows, many=True).data, status=status.HTTP_200_OK)


class BorrowApproveView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]

    def patch(self, request, borrow_id):
        try:
            borrow = BorrowedBook.objects.select_related("book").get(pk=borrow_id)
        except BorrowedBook.DoesNotExist:
            return Response({"detail": "Borrow record not found."}, status=status.HTTP_404_NOT_FOUND)

        if borrow.status != BorrowStatus.PENDING:
            return Response(
                {"detail": f"Cannot approve a borrow with status '{borrow.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            days = int(request.data.get("days", DEFAULT_BORROW_DAYS))
            if days <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response(
                {"detail": "Invalid value for 'days'. Must be a positive integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            book = borrow.book.__class__.objects.select_for_update().get(pk=borrow.book.pk)

            if book.status == 'borrowed':
                return Response(
                    {"detail": "Book is no longer available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            book.status = 'borrowed'
            book.save(update_fields=["status"])

            borrow.status   = BorrowStatus.ACTIVE
            borrow.due_date = date.today() + timedelta(days=days)
            borrow.save(update_fields=["status", "due_date"])

        return Response(BorrowSerializer(borrow).data, status=status.HTTP_200_OK)


class BorrowRejectView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]

    def patch(self, request, borrow_id):
        try:
            borrow = BorrowedBook.objects.get(pk=borrow_id)
        except BorrowedBook.DoesNotExist:
            return Response({"detail": "Borrow record not found."}, status=status.HTTP_404_NOT_FOUND)

        if borrow.status != BorrowStatus.PENDING:
            return Response(
                {"detail": f"Cannot reject a borrow with status '{borrow.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        borrow.status = BorrowStatus.REJECTED
        borrow.save(update_fields=["status"])
        return Response(BorrowSerializer(borrow).data, status=status.HTTP_200_OK)


class BorrowOverdueView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]

    def get(self, request):
        borrows = BorrowedBook.objects.get_overdue_borrows().select_related("book", "user")
        return Response(BorrowSerializer(borrows, many=True).data, status=status.HTTP_200_OK)