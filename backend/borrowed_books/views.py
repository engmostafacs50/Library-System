from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.authentication import CookieJWTAuthentication
from .models import BorrowedBook, BorrowStatus
from users.permissions import IsAuthenticated, IsAdminUser
from .serializers import BorrowSerializer


# ──────────────────────────────────────────────────────────────────────────────
# User-facing views
# ──────────────────────────────────────────────────────────────────────────────

class BorrowView(APIView):
    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAuthenticated]


    def post(self, request):

        data = {**request.data, "user": request.user.pk}

        serializer = BorrowSerializer(data=data)
        if serializer.is_valid():
            borrow = serializer.save()
            return Response(
                BorrowSerializer(borrow).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def get(self, request):
        """Return all borrow records that belong to the calling user."""
        borrows    = BorrowedBook.objects.get_borrows_by_user(request.user.pk)
        serializer = BorrowSerializer(borrows, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)




class BorrowAdminView(APIView):
    """
    GET  /api/borrow/admin/              → all borrow records
    GET  /api/borrow/admin/<user_id>/    → borrow records for a specific user
    PATCH /api/borrow/admin/<borrow_id>/return/ → mark as returned
    """

    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]


    def get(self, request, user_id=None):
        """List all borrows, or filter by user_id when supplied."""
        if user_id is not None:
            borrows = BorrowedBook.objects.get_borrows_by_user(user_id)
        else:
            borrows = BorrowedBook.objects.all().select_related("book", "user")

        serializer = BorrowSerializer(borrows, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class BorrowReturnView(APIView):


    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]

    def patch(self, request, borrow_id):
        try:
            borrow = BorrowedBook.objects.select_related("book").get(pk=borrow_id)
        except BorrowedBook.DoesNotExist:
            return Response(
                {"detail": "Borrow record not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if borrow.status != BorrowStatus.ACTIVE:
            return Response(
                {"detail": f"Borrow is already '{borrow.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.db import transaction

        with transaction.atomic():
            book = borrow.book
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
        borrows    = BorrowedBook.objects.get_overdue_borrows().select_related("book", "user")
        serializer = BorrowSerializer(borrows, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)