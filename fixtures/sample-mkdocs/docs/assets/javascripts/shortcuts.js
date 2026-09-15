keyboard$.subscribe(function(key) {
    // Action on "w" key
    if (key.mode === "global" && (key.type === "w" || key.type === "ц")) {
        // Make wide grid
        var elements = document.querySelectorAll(".md-grid");
        for (var i = 0; i < elements.length; i++) {
            elements[i].classList.toggle("wide");
        }
        // Hide navigation sidebar
        var navSidebar = document.getElementsByClassName("md-sidebar md-sidebar--primary")[0];
        if(navSidebar.hasAttribute("hidden")) {
            navSidebar.removeAttribute("hidden");
        }
        else {
            navSidebar.setAttribute("hidden", true);
        }
    }
})
