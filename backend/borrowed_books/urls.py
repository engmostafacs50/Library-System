from django.urls import path
from .views import (
    BorrowView,
    BorrowAdminView,
    BorrowPendingView,
    BorrowApproveView,
    BorrowRejectView,
    BorrowOverdueView,
)

app_name = "borrowed_books"

urlpatterns = [
    path("",                                BorrowView.as_view()),

    path("admin/",                          BorrowAdminView.as_view()),
    path("admin/pending/",                  BorrowPendingView.as_view()),
    path("admin/overdue/",                  BorrowOverdueView.as_view()),
    path("admin/<int:user_id>/",            BorrowAdminView.as_view()),

    path("admin/<int:borrow_id>/approve/",  BorrowApproveView.as_view()),
    path("admin/<int:borrow_id>/reject/",   BorrowRejectView.as_view()),
]