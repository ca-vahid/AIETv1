// alert("test");
var postTitle = document.getElementById("post-title");
var postDescription = document.getElementById("post-description");
var postContent = document.getElementById("post-content");
var postImage = document.getElementById("post-image");

var resultFromSnap;

function getPost() {
  var postObject = {
    valueToSend: 1,
  };

  fetch("/snap/getpost/", {
    credentials: "include",
    method: "POST",
    body: JSON.stringify(postObject),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .then((res) => (resultFromSnap = res.data.postResponse))
    .then((res) => console.log(resultFromSnap))

    .then((res) => (postTitle.innerHTML = resultFromSnap[0].title))
    .then((res) => (postDescription.innerHTML = resultFromSnap[0].description))
    .then((res) => (postContent.innerHTML = resultFromSnap[0].content))
    .then((res) => (postImage.innerHTML = resultFromSnap[0].image))
    .catch((error) => console.log(error));
}

getPost();

// GET POST ACCORDING TO PAGE

var current_page = 1;
var records_per_page = 1;

function prevPage() {
  if (current_page > 1) {
    current_page--;
    changePage(current_page);
  }
}

function nextPage() {
  if (current_page < numPages()) {
    current_page++;
    changePage(current_page);
  }
}

function changePage(page) {
  var btn_next = document.getElementById("btn_next");
  var btn_prev = document.getElementById("btn_prev");
  var page_span = document.getElementById("page");

  // Validate page
  if (page < 1) page = 1;
  if (page > numPages()) page = numPages();

  for (
    var i = (page - 1) * records_per_page;
    i < page * records_per_page && i < resultFromSnap.length;
    i++
  ) {
    postTitle.innerHTML = resultFromSnap[i].title;
    postDescription.innerHTML = resultFromSnap[i].description;
    postContent.innerHTML = resultFromSnap[i].content;
    postImage.innerHTML = resultFromSnap[i].image;
    // postImage.src = "'" + resultFromSnap[i].image + "'";
    postImage.style.height = "auto";
    postImage.style.width = "100%";
  }
  page_span.innerHTML = page + "/" + numPages();

  if (page == 1) {
    btn_prev.style.visibility = "hidden";
  } else {
    btn_prev.style.visibility = "visible";
  }

  if (page == numPages()) {
    btn_next.style.visibility = "hidden";
  } else {
    btn_next.style.visibility = "visible";
  }
}

function numPages() {
  return Math.ceil(resultFromSnap.length / records_per_page);
}

window.onload = function () {
  changePage(1);
};
