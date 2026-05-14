from rest_framework import serializers

from .models import BorrowedBook, BorrowManager, BorrowStatus


class BorrowSerializer(serializers.ModelSerializer):

    is_overdue = serializers.SerializerMethodField(read_only=True)
    book_title = serializers.SerializerMethodField(read_only=True)
    username   = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = BorrowedBook
        fields = [
            "id",
            "user",
            "book",
            "book_title",
            "username",
            "borrow_date",
            "due_date",
            "status",
            "created_at",
            "is_overdue",
        ]
        read_only_fields = ["id", "borrow_date", "status", "created_at", "is_overdue", "book_title", "username"]

    def validate(self, data: dict) -> dict:
        book = data.get("book")
        user = data.get("user")

        if book and not BorrowManager().is_book_available(book.pk):
            raise serializers.ValidationError(
                {"book": "This book is not available for borrowing."}
            )

        if user and book:
            already_exists = BorrowedBook.objects.filter(
                user=user,
                book=book,
                status__in=[BorrowStatus.ACTIVE, BorrowStatus.PENDING],
            ).exists()
            if already_exists:
                raise serializers.ValidationError(
                    "You already have an active or pending borrow for this book."
                )

        return data

    def create(self, validated_data: dict) -> BorrowedBook:
        return BorrowedBook.objects.create(**validated_data)

    def get_is_overdue(self, obj: BorrowedBook) -> bool:
        return obj.is_overdue()

    def get_book_title(self, obj: BorrowedBook) -> str:
        try:
            return obj.book.title
        except Exception:
            return None

    def get_username(self, obj: BorrowedBook) -> str:
        try:
            return obj.user.username
        except Exception:
            return None