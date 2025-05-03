// alert("test");
var postTitleFutureImperfect = document.getElementById("post-title-future-imperfect");
var postDescriptionFutureImperfect = document.getElementById("post-description-future-imperfect");
var postContentFutureImperfect = document.getElementById("post-content-future-imperfect");
var postImageFutureImperfect = document.getElementById("post-image-future-imperfect");

var resultFromSnapFutureImperfect;

function getPostFutureImperfect() {
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
    .then((res) => (resultFromSnapFutureImperfect = res.data.postResponse))
    .then((res) => console.log(resultFromSnapFutureImperfect))

    .then((res) => (postTitleFutureImperfect.innerHTML = resultFromSnapFutureImperfect[0].title))
    .then((res) => (postDescriptionFutureImperfect.innerHTML = resultFromSnapFutureImperfect[0].description))
    .then((res) => (postContentFutureImperfect.innerHTML = resultFromSnapFutureImperfect[0].content))
    .then((res) => (postImageFutureImperfect.innerHTML = resultFromSnapFutureImperfect[0].image))
    .catch((error) => console.log(error));
}

getPostFutureImperfect();

// GET POST ACCORDING TO PAGE

var current_page = 1;
var records_per_page = 1;

function prevPageFutureImperfect() {
  if (current_page > 1) {
    current_page--;
    changePageFutureImperfect(current_page);
  }
}

function nextPageFutureImperfect() {
  if (current_page < numPagesFutureImperfect()) {
    current_page++;
    changePageFutureImperfect(current_page);
  }
}

function changePageFutureImperfect(page) {
  var btn_next = document.getElementById("btn_next");
  var btn_prev = document.getElementById("btn_prev");
  var page_span = document.getElementById("page");

  // Validate page
  if (page < 1) page = 1;
  if (page > numPagesFutureImperfect()) page = numPagesFutureImperfect();

  for (
    var i = (page - 1) * records_per_page;
    i < page * records_per_page && i < resultFromSnapFutureImperfect.length;
    i++
  ) {
    postTitleFutureImperfect.innerHTML = resultFromSnapFutureImperfect[i].title;
    postDescriptionFutureImperfect.innerHTML = resultFromSnapFutureImperfect[i].description;
    postContentFutureImperfect.innerHTML = resultFromSnapFutureImperfect[i].content;
    postImageFutureImperfect.innerHTML = resultFromSnapFutureImperfect[i].image;
    // postImageFutureImperfect.src = "'" + resultFromSnapFutureImperfect[i].image + "'";
    postImageFutureImperfect.style.height = "auto";
    postImageFutureImperfect.style.width = "100%";
  }
  page_span.innerHTML = page + "/" + numPagesFutureImperfect();

  if (page == 1) {
    btn_prev.style.visibility = "hidden";
  } else {
    btn_prev.style.visibility = "visible";
  }

  if (page == numPagesFutureImperfect()) {
    btn_next.style.visibility = "hidden";
  } else {
    btn_next.style.visibility = "visible";
  }
}

function numPagesFutureImperfect() {
  return Math.ceil(resultFromSnapFutureImperfect.length / records_per_page);
}

window.onload = function () {
  changePageFutureImperfect(1);
};
