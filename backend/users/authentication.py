from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):

    def authenticate(self, request):

        print("COOKIES =", request.COOKIES)

        raw_token = request.COOKIES.get("access_token")

        print("TOKEN =", raw_token)

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)

        print("VALIDATED =", validated_token)

        user = self.get_user(validated_token)

        print("USER =", user)

        return (user, validated_token)