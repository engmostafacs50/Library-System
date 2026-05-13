from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.conf import settings

from .serializers import UserSerializer, LoginSerializer
from .models import User
from borrowed_books.serializers import BorrowSerializer
from borrowed_books.models import BorrowedBook
from returned_books.serializers import ReturnSerializer
from returned_books.models import ReturnedBook


def set_auth_cookies(response, user):
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    is_secure = not settings.DEBUG  # only send over HTTPS in production

    # Access token cookie — short lived
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=is_secure,
        samesite="Lax",
        path="/",
    )

    # Refresh token cookie — long lived 
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=is_secure,
        samesite="Lax",
        path="/api/users/token/refresh/",  
    )

    return response


class RegisterView(APIView):
    """
    POST /api/users/register/
    Register flow: RegisterView -> UserSerializer -> UserManager -> DB
    Sets access_token + refresh_token as HttpOnly cookies.
    """

    permission_classes = []

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            response = Response(
                {
                    "message": "User registered successfully.",
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_201_CREATED,
            )
            return set_auth_cookies(response, user)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AuthView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            response = Response(
                {
                    "message": "Login successful.",
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )
            return set_auth_cookies(response, user)
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):


    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except (TokenError, InvalidToken):
                pass  # already invalid — clear cookies anyway

        response = Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/api/users/token/refresh/")
        return response


class CookieTokenRefreshView(APIView):
  

    permission_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "Refresh token not found."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
        except (TokenError, InvalidToken) as e:
            return Response({"detail": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

        is_secure = not settings.DEBUG
        response = Response({"message": "Token refreshed."}, status=status.HTTP_200_OK)
        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
            httponly=True,
            secure=is_secure,
            samesite="Lax",
            path="/",
        )
        return response


class AdminView(APIView):

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    



class AdminUserDetailView(APIView):
    """
    PATCH /api/users/admin/users/<user_id>/  → toggle active/inactive
    DELETE /api/users/admin/users/<user_id>/ → delete user
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user.is_active = not user.is_active
        user.save(update_fields=["is_active"])
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

    def delete(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        user.delete()
        return Response({"detail": "User deleted."}, status=status.HTTP_204_NO_CONTENT)


class AdminUserHistoryView(APIView):
    """
    GET /api/users/admin/users/<user_id>/history/
    Returns all borrow and return records for a specific user.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        borrows = BorrowedBook.objects.get_borrows_by_user(user_id)
        returns = ReturnedBook.objects.get_returns_by_user(user_id)

        return Response({
            "user":    UserSerializer(user).data,
            "borrows": BorrowSerializer(borrows, many=True).data,
            "returns": ReturnSerializer(returns, many=True).data,
        }, status=status.HTTP_200_OK)