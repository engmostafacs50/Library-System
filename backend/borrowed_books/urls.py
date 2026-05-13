from django.urls import path

from .views import BorrowAdminView, BorrowOverdueView, BorrowReturnView, BorrowView

app_name = "borrowed_books"

urlpatterns = [
    path("", BorrowView.as_view(), name="borrow"),
    
    path("admin/", BorrowAdminView.as_view(), name="admin-list"),

    path("admin/overdue/", BorrowOverdueView.as_view(), name="admin-overdue"),

    path("admin/<int:user_id>/", BorrowAdminView.as_view(), name="admin-by-user"),

    path(
        "admin/<int:borrow_id>/return/",
        BorrowReturnView.as_view(),
        name="admin-return",
    ),
]