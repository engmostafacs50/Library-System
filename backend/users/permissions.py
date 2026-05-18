from rest_framework.permissions import BasePermission


class IsAuthenticated(BasePermission):
  
    message = "Authentication credentials were not provided or are invalid."

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_authenticated)


class IsAdminUser(BasePermission):

    def has_permission(self, request, view) -> bool:
        if not (request.user and request.user.is_authenticated):
            return False

        # Prefer a custom role field; fall back to Django's is_staff
        role = getattr(request.user, "role", None)
        if role is not None:
            return role == "ADMIN"
        return bool(request.user.is_staff or request.user.is_superuser)