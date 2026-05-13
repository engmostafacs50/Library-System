from datetime import date

from rest_framework import serializers

from .models import BorrowedBook, BorrowManager, BorrowStatus


class BorrowSerializer(serializers.ModelSerializer):

    is_overdue = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = BorrowedBook
        fields = [
            "id",
            "user",
            "book",
            "borrow_date",
            "due_date",
            "status",
            "created_at",
            "is_overdue",
        ]
        read_only_fields = ["id", "borrow_date", "status", "created_at", "is_overdue"]
        
    def validate(self, data: dict) -> dict:
        book     = data.get("book")
        due_date = data.get("due_date")

        # 1. due_date must be in the future
        if due_date and due_date <= date.today():
            raise serializers.ValidationError(
                {"due_date": "due_date must be a future date."}
            )

        # 2. book must be available
        if book and not BorrowManager().is_book_available(book.pk):
            raise serializers.ValidationError(
                {"book": "This book is not available for borrowing."}
            )

        # 3. user must not already have an active borrow for the same book
        user = data.get("user")
        if user and book:
            already_borrowed = BorrowedBook.objects.filter(
                user=user, book=book, status=BorrowStatus.ACTIVE
            ).exists()
            if already_borrowed:
                raise serializers.ValidationError(
                    "You already have an active borrow for this book."
                )

        return data


    def create(self, validated_data: dict) -> BorrowedBook:
        from django.db import transaction

        with transaction.atomic():
            book = validated_data["book"]

            # Re-fetch with a row-level lock to avoid race conditions
            book.__class__.objects.select_for_update().get(pk=book.pk)
            book.refresh_from_db()

            if book.quantity <= 0 or not book.available:
                raise serializers.ValidationError(
                    {"book": "This book is not available (race condition)."}
                )

            book.quantity -= 1
            if book.quantity == 0:
                book.available = False
            book.save(update_fields=["quantity", "available"])

            return BorrowedBook.objects.create(**validated_data)

    def get_is_overdue(self, obj: BorrowedBook) -> bool:
        return obj.is_overdue()