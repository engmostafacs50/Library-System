from rest_framework import serializers

from .models import BookCondition, ReturnedBook, ReturnManager


class ReturnSerializer(serializers.ModelSerializer):

   # Nested read-only info
    borrower_username = serializers.SerializerMethodField(read_only=True)
    book_title        = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = ReturnedBook
        fields = [
            "id",
            "borrowed_book",
            "return_date",
            "condition",
            "created_at",
            "borrower_username",
            "book_title",
        ]
        read_only_fields = [
            "id", "return_date", "created_at",
            
            "borrower_username", "book_title",
        ]



    def validate(self, data: dict) -> dict:
        from borrowed_books.models import BorrowStatus  
        borrowed_book = data.get("borrowed_book")


        if borrowed_book and borrowed_book.status != BorrowStatus.ACTIVE:
            raise serializers.ValidationError(
                {"borrowed_book": "This borrow is already closed or returned."}
            )

        # 2. Must not already have a return record
        if borrowed_book and hasattr(borrowed_book, "return_record"):
            raise serializers.ValidationError(
                {"borrowed_book": "A return record already exists for this borrow."}
            )

        return data



    def create(self, validated_data: dict) -> ReturnedBook:
        borrowed_book = validated_data["borrowed_book"]
        condition     = validated_data.get("condition", BookCondition.GOOD)

   
        return ReturnedBook.objects.process_return(
            borrowed_book_id=borrowed_book.pk,
            condition=condition,
        )

 



    def get_borrower_username(self, obj: ReturnedBook) -> str:
        return obj.borrowed_book.user.username

    def get_book_title(self, obj: ReturnedBook) -> str:
        return obj.borrowed_book.book.title