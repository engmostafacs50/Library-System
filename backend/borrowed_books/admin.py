from django.contrib import admin
from django.utils import timezone
from datetime import date, timedelta
from django.db import transaction

from .models import BorrowedBook, BorrowStatus

DEFAULT_BORROW_DAYS = 14


@admin.register(BorrowedBook)
class BorrowedBookAdmin(admin.ModelAdmin):
    list_display    = ("id", "user", "book", "borrow_date", "due_date", "status", "is_overdue_display")
    list_filter     = ("status",)
    search_fields   = ("user__username", "book__title")
    ordering        = ("-created_at",)
    readonly_fields = ("borrow_date", "created_at")

    actions = ["approve_borrows", "reject_borrows", "mark_as_returned", "mark_as_overdue"]

    @admin.display(boolean=True, description="Overdue?")
    def is_overdue_display(self, obj):
        return obj.is_overdue()

    @admin.action(description="Approve selected PENDING borrows")
    def approve_borrows(self, request, queryset):
        approved = 0
        skipped  = 0
        with transaction.atomic():
            for borrow in queryset.filter(status=BorrowStatus.PENDING).select_related("book"):
                book = borrow.book.__class__.objects.select_for_update().get(pk=borrow.book.pk)
                if book.quantity <= 0 or not book.available:
                    skipped += 1
                    continue
                book.quantity -= 1
                if book.quantity == 0:
                    book.available = False
                book.save(update_fields=["quantity", "available"])

                borrow.status   = BorrowStatus.ACTIVE
                borrow.due_date = date.today() + timedelta(days=DEFAULT_BORROW_DAYS)
                borrow.save(update_fields=["status", "due_date"])
                approved += 1

        msg = f"{approved} borrow(s) approved."
        if skipped:
            msg += f" {skipped} skipped (book no longer available)."
        self.message_user(request, msg)

    @admin.action(description="Reject selected PENDING borrows")
    def reject_borrows(self, request, queryset):
        updated = queryset.filter(status=BorrowStatus.PENDING).update(status=BorrowStatus.REJECTED)
        self.message_user(request, f"{updated} borrow(s) rejected.")

    @admin.action(description="Mark selected borrows as Returned")
    def mark_as_returned(self, request, querrows):
        with transaction.atomic():
            for borrow in querrows.filter(status=BorrowStatus.ACTIVE).select_related("book"):
                book           = borrow.book
                book.quantity += 1
                book.available = True
                book.save(update_fields=["quantity", "available"])
                borrow.status  = BorrowStatus.RETURNED
                borrow.save(update_fields=["status"])
        self.message_user(request, "Selected borrows marked as returned.")

    @admin.action(description="Mark selected active+overdue borrows as Overdue")
    def mark_as_overdue(self, request, queryset):
        updated = queryset.filter(
            status=BorrowStatus.ACTIVE,
            due_date__lt=timezone.now().date(),
        ).update(status=BorrowStatus.OVERDUE)
        self.message_user(request, f"{updated} borrow(s) marked as overdue.")