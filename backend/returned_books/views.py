from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from users.authentication import CookieJWTAuthentication  # your shared auth
from users.permissions import IsAuthenticated, IsAdminUser  # your shared perms

from .models import ReturnedBook
from .serializers import ReturnSerializer


# ──────────────────────────────────────────────────────────────────────────────
# User-facing views
# ──────────────────────────────────────────────────────────────────────────────

class ReturnView(APIView):


    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAuthenticated]


    def post(self, request):

        from borrowed_books.models import BorrowedBook  # adjust if needed

        borrow_id = request.data.get("borrowed_book")
        try:
            borrow = BorrowedBook.objects.get(pk=borrow_id, user=request.user)
        except BorrowedBook.DoesNotExist:
            return Response(
                {"detail": "Borrow record not found or does not belong to you."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ReturnSerializer(data=request.data)
        if serializer.is_valid():
            try:
                returned = serializer.save()
            except ValueError as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            return Response(
                ReturnSerializer(returned).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def get(self, request):

        returns    = ReturnedBook.objects.get_returns_by_user(request.user.pk)
        serializer = ReturnSerializer(returns, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ReturnAdminView(APIView):
 

    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]

    def get(self, request, user_id=None):
        if user_id is not None:
            returns = ReturnedBook.objects.get_returns_by_user(user_id)
        else:
            returns = ReturnedBook.objects.get_all_returns()

        serializer = ReturnSerializer(returns, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ReturnFinesView(APIView):


    authentication_classes = [CookieJWTAuthentication]
    permission_classes     = [IsAdminUser]

    def get(self, request):
        returns = (
            ReturnedBook.objects.get_all_returns()
            .filter(fine__gt=0)
        )
        serializer = ReturnSerializer(returns, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)