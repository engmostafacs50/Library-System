from datetime import date, timedelta

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.authentication import CookieJWTAuthentication
from users.permissions import IsAuthenticated, IsAdminUser
from .models import BorrowedBook, BorrowStatus
from .serializers import BorrowSerializer

DEFAULT_BORROW_DAYS = 14  # change to whatever default you want


# ─────────────────────────────────────────────────────────────
# User-facing views
# ─────────────────────────────────────────────────────────────

class BorrowView(APIView):
    """
    POST /api/borrow/       → create a PENDING borrow request
    GET  /api/borrow/       → list the calling user's borrows
    """
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


# ─────────────────────────────────────────────────────────────
# Admin views
# ─────────────────────────────────────────────────────────────

class BorrowAdminView(APIView):
    """
    GET /api/borrow/admin/             → all borrow records
    GET /api/borrow/admin/<user_id>/   → borrows for a specific user
    """
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]

    def get(self, request, user_id=None):
        if user_id is not None:
            borrows = BorrowedBook.objects.get_borrows_by_user(user_id)
        else:
            borrows = BorrowedBook.objects.all().select_related("book", "user")
        return Response(BorrowSerializer(borrows, many=True).data, status=status.HTTP_200_OK)


class BorrowPendingView(APIView):
    """
    GET /api/borrow/admin/pending/   → all PENDING borrow requests
    """
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

        with transaction.atomic():
            book = borrow.book.__class__.objects.select_for_update().get(pk=borrow.book.pk)

            if book.quantity <= 0 or not book.available:
                return Response(
                    {"detail": "Book is no longer available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            book.quantity -= 1
            if book.quantity == 0:
                book.available = False
            book.save(update_fields=["quantity", "available"])

            borrow.status   = BorrowStatus.ACTIVE
            borrow.due_date = date.today() + timedelta(days=DEFAULT_BORROW_DAYS)
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


class BorrowReturnView(APIView):
 
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]

    def patch(self, request, borrow_id):
        try:
            borrow = BorrowedBook.objects.select_related("book").get(pk=borrow_id)
        except BorrowedBook.DoesNotExist:
            return Response({"detail": "Borrow record not found."}, status=status.HTTP_404_NOT_FOUND)

        if borrow.status != BorrowStatus.ACTIVE:
            return Response(
                {"detail": f"Borrow is already '{borrow.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            book           = borrow.book
            book.quantity += 1
            book.available = True
            book.save(update_fields=["quantity", "available"])

            borrow.status = BorrowStatus.RETURNED
            borrow.save(update_fields=["status"])

        return Response(BorrowSerializer(borrow).data, status=status.HTTP_200_OK)


class BorrowOverdueView(APIView):

    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]

    def get(self, request):
        borrows = BorrowedBook.objects.get_overdue_borrows().select_related("book", "user")
        return Response(BorrowSerializer(borrows, many=True).data, status=status.HTTP_200_OK)