from django.urls import path
from .views import AuthView, RegisterView, LogoutView, CookieTokenRefreshView, AdminView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", AuthView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("admin/users/", AdminView.as_view(), name="admin-users"),
]