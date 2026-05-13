from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


# ---------------------------------------------------------------------------
# Configurable fine rate – override in settings.py:
#   FINE_RATE_PER_DAY = Decimal("2.00")
# ---------------------------------------------------------------------------
FINE_RATE_PER_DAY: Decimal = Decimal(
    getattr(settings, "FINE_RATE_PER_DAY", "1.00")
)


class BookCondition(models.TextChoices):
    GOOD    = "good",    "Good"
    DAMAGED = "damaged", "Damaged"
    LOST    = "lost",    "Lost"


class ReturnManager(models.Manager):
    """Custom manager – mirrors ReturnManager in the UML diagram."""

    def get_all_returns(self):
        return self.select_related(
            "borrowed_book__user",
            "borrowed_book__book",
        ).all()

    def get_returns_by_user(self, user_id):
        return self.select_related(
            "borrowed_book__book",
            "borrowed_book__user",
        ).filter(borrowed_book__user_id=user_id)

    def calculate_fine(self, borrowed_book) -> Decimal:

        today = timezone.now().date()
        if today <= borrowed_book.due_date:
            return Decimal("0.00")
        overdue_days = (today - borrowed_book.due_date).days
        return (overdue_days * FINE_RATE_PER_DAY).quantize(Decimal("0.01"))

    def process_return(self, borrowed_book_id: int, condition: str) -> "ReturnedBook":

        from django.db import transaction
        from borrowed_books.models import BorrowedBook, BorrowStatus  # adjust if needed

        with transaction.atomic():
            # 1. Lock the borrow row
            borrowed_book = (
                BorrowedBook.objects.select_for_update()
                .select_related("book")
                .get(pk=borrowed_book_id)
            )

            if borrowed_book.status == BorrowStatus.RETURNED:
                raise ValueError("This borrow record is already closed.")

            # 2. Fine
            fine = self.calculate_fine(borrowed_book)

            # 3. Create return record
            returned = self.create(
                borrowed_book=borrowed_book,
                return_date=timezone.now().date(),
                condition=condition,
                fine=fine,
            )

            # 4. Close the borrow
            borrowed_book.status = BorrowStatus.RETURNED
            borrowed_book.save(update_fields=["status"])

            # 5. Restore book stock
            book = borrowed_book.book
            book.quantity += 1
            book.available = True
            book.save(update_fields=["quantity", "available"])

        return returned


class ReturnedBook(models.Model):
    borrowed_book = models.OneToOneField(
        "borrowed_books.BorrowedBook",          # adjust to your app label
        on_delete=models.CASCADE,
        related_name="return_record",
    )
    return_date = models.DateField(default=timezone.now)
    condition   = models.CharField(
        max_length=10,
        choices=BookCondition.choices,
        default=BookCondition.GOOD,
    )
    fine       = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = ReturnManager()

    class Meta:
        ordering        = ["-created_at"]
        verbose_name    = "Returned Book"
        verbose_name_plural = "Returned Books"

    def __str__(self):
        return f"Return#{self.pk} — {self.borrowed_book} [{self.condition}]"

    def has_fine(self) -> bool:
        return self.fine > Decimal("0.00")