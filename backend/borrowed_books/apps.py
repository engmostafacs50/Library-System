from django.apps import AppConfig


class BorrowedBooksConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name               = "borrowed_books"
    verbose_name       = "Borrowed Books"