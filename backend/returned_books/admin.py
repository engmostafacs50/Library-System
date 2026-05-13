from django.contrib import admin

from .models import ReturnedBook


@admin.register(ReturnedBook)
class ReturnedBookAdmin(admin.ModelAdmin):
    list_display  = (
        "id",
        "get_borrower",
        "get_book_title",
        "return_date",
        "condition",
        "fine",
        "has_fine_display",
    )
    list_filter   = ("condition",)
    search_fields = (
        "borrowed_book__user__username",
        "borrowed_book__book__title",
    )
    ordering      = ("-created_at",)
    readonly_fields = ("return_date", "fine", "created_at")

    @admin.display(description="Borrower")
    def get_borrower(self, obj):
        return obj.borrowed_book.user.username

    @admin.display(description="Book")
    def get_book_title(self, obj):
        return obj.borrowed_book.book.title

    @admin.display(boolean=True, description="Has Fine?")
    def has_fine_display(self, obj):
        return obj.has_fine()