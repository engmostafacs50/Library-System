from datetime import date

from django.db import models
from django.conf import settings
from django.utils import timezone


class BorrowStatus(models.TextChoices):
    PENDING  = "pending",  "Pending"
    ACTIVE   = "active",   "Active"
    RETURNED = "returned", "Returned"
    OVERDUE  = "overdue",  "Overdue"
    REJECTED = "rejected", "Rejected"


class BorrowManager(models.Manager):

    def get_pending_borrows(self):
        return self.filter(status=BorrowStatus.PENDING)

    def get_active_borrows(self):
        return self.filter(status=BorrowStatus.ACTIVE)

    def get_borrows_by_user(self, user_id):
        return self.filter(user_id=user_id).select_related("book", "user")

    def get_overdue_borrows(self):
        return self.filter(
            status=BorrowStatus.ACTIVE,
            due_date__lt=timezone.now().date(),
        )

    def is_book_available(self, book_id):
        from books.models import Book
        try:
            book = Book.objects.get(pk=book_id)
            return book.status == 'available' and book.quantity > 0
        except Book.DoesNotExist:
            return False


class BorrowedBook(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="borrowed_books",
    )
    book = models.ForeignKey(
        "books.Book",
        on_delete=models.CASCADE,
        related_name="borrow_records",
    )
    borrow_date = models.DateField(default=date.today)
    due_date    = models.DateField(null=True, blank=True)
    status      = models.CharField(
        max_length=10,
        choices=BorrowStatus.choices,
        default=BorrowStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    objects = BorrowManager()

    class Meta:
        ordering            = ["-created_at"]
        verbose_name        = "Borrowed Book"
        verbose_name_plural = "Borrowed Books"

    def __str__(self):
        return f"{self.user} → {self.book} [{self.status}]"

    def is_overdue(self) -> bool:
        return (
            self.status == BorrowStatus.ACTIVE
            and self.due_date is not None
            and self.due_date < timezone.now().date()
        )