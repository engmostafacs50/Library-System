from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.conf import settings

from .serializers import UserSerializer, LoginSerializer
from .models import User


def set_auth_cookies(response, user):
    """Generate JWT tokens and set them as HttpOnly cookies on the response."""
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    is_secure = not settings.DEBUG  # only send over HTTPS in production

    # Access token cookie — short lived (matches ACCESS_TOKEN_LIFETIME)
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=is_secure,
        samesite="Lax",
        path="/",
    )

    # Refresh token cookie — long lived (matches REFRESH_TOKEN_LIFETIME)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=is_secure,
        samesite="Lax",
        path="/api/users/token/refresh/",  # scoped — only sent on refresh endpoint
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
    """
    POST /api/users/login/
    Login flow: AuthView -> LoginSerializer -> authenticate() -> JWT cookies
    """

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
    """
    POST /api/users/logout/
    Blacklists the refresh token and clears both cookies.
    """

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
    """
    POST /api/users/token/refresh/
    Reads refresh_token from cookie, issues a new access_token cookie.
    Replaces the default SimpleJWT TokenRefreshView.
    """

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
    """
    GET /api/users/admin/users/
    Returns all users. Admin only.
    """

    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)