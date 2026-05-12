from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.exceptions import AuthenticationFailed


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # Try cookie first
        raw_token = request.COOKIES.get("access_token")

        # Fall back to Authorization header (useful for mobile / API clients)
        if raw_token is None:
            return super().authenticate(request)

        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, TokenError) as e:
            raise AuthenticationFailed(str(e))

        return self.get_user(validated_token), validated_token