from django.contrib import admin
from django.utils import timezone

from .models import BorrowedBook, BorrowStatus


@admin.register(BorrowedBook)
class BorrowedBookAdmin(admin.ModelAdmin):
    list_display  = ("id", "user", "book", "borrow_date", "due_date", "status", "is_overdue_display")
    list_filter   = ("status",)
    search_fields = ("user__username", "book__title")
    ordering      = ("-created_at",)
    readonly_fields = ("borrow_date", "created_at")

    actions = ["mark_as_returned", "mark_as_overdue"]

    @admin.display(boolean=True, description="Overdue?")
    def is_overdue_display(self, obj):
        return obj.is_overdue()

    @admin.action(description="Mark selected borrows as Returned")
    def mark_as_returned(self, request, queryset):
        from django.db import transaction

        with transaction.atomic():
            for borrow in queryset.filter(status=BorrowStatus.ACTIVE).select_related("book"):
                book = borrow.book
                book.quantity += 1
                book.available = True
                book.save(update_fields=["quantity", "available"])

                borrow.status = BorrowStatus.RETURNED
                borrow.save(update_fields=["status"])

        self.message_user(request, "Selected borrows marked as returned.")

    @admin.action(description="Mark selected active+overdue borrows as Overdue")
    def mark_as_overdue(self, request, queryset):
        updated = queryset.filter(
            status=BorrowStatus.ACTIVE,
            due_date__lt=timezone.now().date(),
        ).update(status=BorrowStatus.OVERDUE)
        self.message_user(request, f"{updated} borrow(s) marked as overdue.")