from django.urls import path

from .views import ReturnAdminView, ReturnFinesView, ReturnView

app_name = "returned_books"

urlpatterns = [

    path("", ReturnView.as_view(), name="return"),
    path("admin/", ReturnAdminView.as_view(), name="admin-list"),
    path("admin/fines/", ReturnFinesView.as_view(), name="admin-fines"),
    path("admin/<int:user_id>/", ReturnAdminView.as_view(), name="admin-by-user"),
]