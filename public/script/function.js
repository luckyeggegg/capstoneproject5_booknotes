
$(document).ready(function() {
    $(".dropdown-item").click(function(e){
        e.preventDefault(); // Prevent the default submission

        // Get the order condition (item)
        const orderItem = $(this).data("order");    // .data('order'): The .data() method is a jQuery function that retrieves the value of a data-* attribute from the selected element. When you define a data-* attribute in HTML, you can access it in jQuery by passing the part of the attribute name after the data- prefix to the .data() method.

        // console.log(orderItem);

        // Make an AJAX request to the server with the selected order
        $.ajax({
            url: "/",   // The endpoint where your server handles the ordering
            type: "GET",
            data: {orderItem: orderItem},
            success: function(response) {
                // Replace the book list in the DOM with the new ordered list from the server response
                $(".booklist").html($(response).find(".booklist").html());
            },
            error: function(err) {
                console.log("Error in ordering books:", err);
            }
        });

    });

    $(".delete-button").click(function(e){
        e.preventDefault();

        var bookId = $(this).data("book-id");
        var $bookInfo = $(this).closest(".book-info");

        if (confirm("Are you sure you want to delete this book?")) {
            $.ajax({
                url: `/delete/${bookId}`,
                type: "DELETE",
                data: {bookId: bookId},
                success: function(response) {
                    $bookInfo.remove(); // Remove the book's element from the DOM
                },
                error: function(err) {
                    console.log("Error in deleting the book", err);
                }
            })
        }
    });

});