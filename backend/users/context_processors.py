# users/context_processors.py
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .models import User

def jwt_user(request):
    token = request.COOKIES.get("access_token")
    if not token:
        return {"jwt_user": None}
    try:
        decoded = AccessToken(token)
        user = User.objects.get(pk=decoded["user_id"])
        return {"jwt_user": user}
    except (TokenError, InvalidToken, User.DoesNotExist):
        return {"jwt_user": None}