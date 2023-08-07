// 宣告變數處理 API URL，之後要更動可以直接修改
const BASE_URL = 'https://webdev.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/movies/'
const POSTER_URL = BASE_URL + '/posters/'

// 從 local storage.getItem('favoriteMovies') 取出存放電影資料
// // 第一次使用收藏功能時，此時 local storage 是空的，會取回 null 值，movies 會得到一個空陣列； 而 local storage 有東西時，就會拿到 localStorage.getItem('favoriteMovies') 取回來的資料
const movies = JSON.parse(localStorage.getItem('favoriteMovies')) || []

// 選出 HTML 需被改寫 <div id="data-panel"> 裡的 Render Movie List
const dataPanel = document.querySelector('#data-panel')
// console.log(dataPanel)
// 搜尋表單
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')

// 電影清單 Render Movie List
// 印製 80 電影時，需要重複的卡片元素，而其中 title, image 的內容需要被改寫
// 函式 renderMovieList 來演算需要的 template literal 嵌套字串和變數
// 選擇用參數(data)的方式傳入來降低耦合性，函式 renderMovieList 就不會被 movies 這個特定一組資料綁死
function renderMovieList(data) {
  let rawHTML = ''
  // title, image, id 隨著每個 item 改變
  data.forEach((item) => {
    // console.log(item)

    rawHTML += `<!-- 一部電影的 HTML 樣板 -->
      <div class="col-sm-3">
        <div class="mb-2">
          <div class="card">
            <img
              src="${POSTER_URL + item.image}"
              class="card-img-top" alt="Movie Poster">
            <div class="card-body">
              <h5 class="card-title">${item.title}</h5>
            </div>
            <div class="card-footer">
              <!-- Button trigger modal -->
              <!-- data-bs-toggle 指定接下來要使用 modal 的形式 -->
              <!-- data-bs-target 定義了互動的目標元件是 #movie-modal -->
              <!-- 用 dataset 在 HTML 標籤上紀錄客製化的資訊，也就是在 HTML 標籤中定義 data-* 的屬性 -->
              <!-- More, + 按鈕新增 data-id 的屬性 -->
              <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal"
                data-bs-target="#movie-modal" data-id='${item.id}'>More</button>
              <!-- 紅色 X 按鈕(remove) -->
              <button class="btn btn-danger btn-remove-favorite" data-id='${item.id}'>X</button>
            </div>
          </div>
        </div>
      </div>
      `
  })

  dataPanel.innerHTML = rawHTML
}

// 互動視窗 Movie Modal
// 函式 showMovieModal 取得電影的 id 值後，使用 axios 發送 request，然後將結果輸出至 HTML 的 Movie modal
function showMovieModal(id) {
  // 取出特定電影 id 的 title、image、release_date、description 資訊
  const modalTitle = document.querySelector('#movie-modal-title')
  const modalImage = document.querySelector('#movie-modal-image')
  const modalDate = document.querySelector('#movie-modal-date')
  const modalDescription = document.querySelector('#movie-modal-description')

  // 使用 axios 發送 request 給 Show API ，傳入電影的 id 資訊
  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data.results
    modalTitle.innerText = data.title
    modalImage.innerHTML = `<img src="${POSTER_URL + data.image}" alt="movie-poster" class="img-fluid">`
    modalDate.innerText = 'Release date: ' + data.release_date
    modalDescription.innerText = data.description
  })
}

// 函式 removeFromFavorite 用傳入的 id 去找到要移除的電影
function removeFormFavorite(id) {
  // 如果沒有 movies 物件（未定義），或是為空陣列，就結束這個函式
  if (!movies || !movies.length) return
  // 在 movies 陣列中，透過 id 識別出被點擊的那部 movie 資料
  // findIndex 會回傳我們該項目的 index ，若沒能找到符合的項目，則會回傳 -1
  const movieIndex = movies.findIndex((movie) => movie.id === id)
  // console.log(typeof movie.id)
  // return console.log(movieIndex)
  // 如果要找的電影 id (變數 id)不在 movies 陣列(回傳 -1)，就結束這個函式
  if (movieIndex === -1) return

  // 刪除該筆 index 的電影
  // .splice(索引位置, 切割數量, 插入的元素內容） 插入或刪除原陣列的內容
  movies.splice(movieIndex, 1)
  // 呼叫 localStorage.setItem('favoriteMovies')，把更新後的 movies 收藏清單同步到 local storage
  localStorage.setItem('favoriteMovies', JSON.stringify(movies))
  console.log(movies)
  // 從新渲染整個 movies 清單
  renderMovieList(movies)
}

// 監聽 dataPanel 如果點擊 More 按鈕，即觸發事件 onPanelClicked；如果點擊 X 按鈕，即觸發事件 removeFormFavorite
dataPanel.addEventListener('click', function onPanelClicked(event) {
  // 用 event.target.matches 來判斷點擊到的物件是否有包含 .btn-show-movie 的 class name
  if (event.target.matches('.btn-show-movie')) {
    // 呼叫 dataset. 來取得 user 的 id 值，將點擊事件的回傳值改成 event.target.dataset.id
    // console.log(event.target.dataset.id)
    // console.log(typeof event.target.dataset.id)
    // event.target.dataset.id 型別為字串，需轉換 Number() 與 movie.id 型別為 number 一致
    // 呼叫 showMovieModal 並傳入電影的 id 值
    showMovieModal(Number(event.target.dataset.id))
  } else if (event.target.matches('.btn-remove-favorite')) {
    // 呼叫 removeFormFavorite 並傳入電影的 id 值
    removeFormFavorite(Number(event.target.dataset.id))
  }
})

// 呼叫函式 renderMovieList，把 movies 傳進去
renderMovieList(movies)