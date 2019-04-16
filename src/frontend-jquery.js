//This is for frontend jQuery stuff

$(document).ready(function () {
    $("#enter").modal('show'); //show modal when page loads

    $('.nav-link').click(function () { //hide alert when different tab is pressed
        $("#alert").hide();
    });

    $("#getbutton").click(function () { //waiting message
        $("#alert").show();
        $(".alert").show().removeClass().addClass("alert alert-info").text("Tweets being added to database...please wait for success message");
    });

    $("#visualize").click(function () {
        $("#visuals").show();
    })

});