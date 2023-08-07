// 宣告變數處理 API URL，之後要更動可以直接修改
const BASE_URL = 'https://webdev.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/movies/'
const POSTER_URL = BASE_URL + '/posters/'
// 分頁每頁只顯示 12 筆資料
const MOVIE_PER_PAGE = 12
// 需要一個容器來存放電影資料 
const movies = []
// 儲存符合篩選條件的項目到 filteredMovies
let filteredMovies = []
// 當前頁數(預設為第 1 頁)
let currentPage = 1;

// 選出 HTML 需被改寫 <div id="data-panel"> 裡的 Render Movie List
const dataPanel = document.querySelector('#data-panel')
// console.log(dataPanel)
// 搜尋表單
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')
const paginator = document.querySelector('#paginator')
// change-mode
const changeMode = document.querySelector("#change-mode");

// 電影清單 Render Movie List
// 印製 80 電影時，需要重複的卡片元素，而其中 title, image 的內容需要被改寫
// 函式 renderMovieList 來演算需要的 template literal 嵌套字串和變數
// 選擇用參數(data)的方式傳入來降低耦合性，函式 renderMovieList 就不會被 movies 這個特定一組資料綁死
function renderMovieList(data) {
  // 模式切換
  // 卡片模式 card-mode
  if (dataPanel.dataset.mode === "card-mode") {
    let rawHTML = "";
    // title, image, id 隨著每個 item 改變
    data.forEach((item) => {
      // console.log(item)
      // 製作 template
      rawHTML += `
      <!-- 一部電影的 HTML 樣板 -->
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
                  data-bs-target="#movie-modal" data-id='${item.id
        }'>More</button>
                <button class="btn btn-info btn-add-favorite" data-id='${item.id
        }'>+</button>
              </div>
            </div>
          </div>
        </div>
        `;
    });
    // 放回 HTML
    dataPanel.innerHTML = rawHTML;
    // 清單模式 list-mode
  } else if (dataPanel.dataset.mode === "list-mode") {
    let rawHTML = `<ul class="list-group">`;
    // title, image, id 隨著每個 item 改變
    data.forEach((item) => {
      // console.log(item)
      // 製作 template
      rawHTML += `
        <li class="list-group-item d-flex justify-content-between">
        <h5 class="card-title d-flex align-items-center">${item.title}</h5>
        <div>
          <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal" data-bs-target="#movie-modal" data-id='${item.id}'>More</button>
          <button class="btn btn-info btn-add-favorite" data-id='${item.id}'>+</button>
        </div>
      </li>
    `;
    });

    rawHTML += `</ul>`;

    // 放回 HTML
    dataPanel.innerHTML = rawHTML;
  }
}

// 分頁器 paginator
// 函式 renderPaginator 算出總頁碼以後，就能製作同樣數量的 li.page-item，並重新渲染到 template 裡
function renderPaginator(amount) {
  // 80 / 12 = 6 ... 8 = 7
  // 計算總頁數(無條件進位)
  // Math.ceil(number) 無條件進位
  const numberOfPages = Math.ceil(amount / MOVIE_PER_PAGE)
  // 製作 template
  let rawHTML = ''
  for (let page = 1; page <= numberOfPages; page++) {
    rawHTML += `
    <!-- 每個a 標籤中，加上 data-page='' 屬性來標注頁數 -->
    <li class="page-item"><a class="page-link" href="#" data-page='${page}'>${page}</a></li>
    `
  }
  // 放回 HTML
  paginator.innerHTML = rawHTML
}

// 函式 getMoviesByPage 負責從總清單裡切割資料
function getMoviesByPage(page) {
  // 如果搜尋清單有東西，就取搜尋清單 filteredMovies，否則就還是取總清單 movies
  // 條件（三元）運算子
  // 條件 ? 值1 : 值2，如果 條件 為 true，運算子回傳 值 1， 否則回傳 值 2
  const data = filteredMovies.length ? filteredMovies : movies
  // page 1 => movies 0 - 11
  // page 2 => movies 12 - 23
  // page 3 => movies 24 - 35
  // ...
  // 計算起始 index
  const startIndex = (page - 1) * MOVIE_PER_PAGE
  // .lice(begin, end) 切割回傳一個新陣列物件 begin 至 end（不含 end）
  return data.slice(startIndex, startIndex + MOVIE_PER_PAGE)
}

// 互動視窗 Movie Modal
// 函式 showMovieModal 取得電影的 id 值後，使用 axios 發送 request，然後將結果輸出至 HTML 的 Movie modal
function showMovieModal(id) {
  // 取出特定電影 id 的 title、image、release_date、description 資訊
  const modalTitle = document.querySelector('#movie-modal-title')
  const modalImage = document.querySelector('#movie-modal-image')
  const modalDate = document.querySelector('#movie-modal-date')
  const modalDescription = document.querySelector('#movie-modal-description')

  // 先將 Movie Modal 內容清空，避免殘影
  modalTitle.innerText = ''
  modalImage.innerHTML = ''
  modalDate.innerText = ''
  modalDescription.innerText = ''

  // 使用 axios 發送 request 給 Show API ，傳入電影的 id 資訊
  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data.results
    modalTitle.innerText = data.title
    modalImage.innerHTML = `<img src="${POSTER_URL + data.image}" alt="movie-poster" class="img-fluid">`
    modalDate.innerText = 'Release date: ' + data.release_date
    modalDescription.innerText = data.description
  })
}

// 瀏覽器的 local storage 存取資料
// local storage 可以將網站資料儲存在使用者的瀏覽器內，儲存至少 5 MB 的單一個網站來源資料 (same domain and protocal)
// 存入資料: localStorage.setItem('key','value')
// 取出資料: localStorage.getItem('key')
// 移除資料: localStorage.removeItem('key')
// key 和 value 都需要是字串 (string)，這是一種類似 JSON 格式的設計
// 存入時，將資料轉為 JSON 格式的字串: JSON.stringify()
// 取出時，將 JSON 格式的字串轉回 JavaScript 原生物件: JSON.parse()
// 如果取不到東西，回傳值是 null

// 若使用者點擊了收藏按鈕，就會呼叫 addToFavorite() 並傳入電影的 id，將使用者點擊到的那一部電影送進 local storage 儲存起來
function addToFavorite(id) {
  // console.log(id)
  // 第一次使用收藏功能時，此時 local storage 是空的，會取回 null 值，list 會得到一個空陣列； 而 local storage 有東西時，就會拿到 localStorage.getItem('favoriteMovies') 取回來的資料
  // OR 的符號是 || (pipe)，當判斷左右兩邊都是 true ，以左邊為優先
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || []
  // 在 movies 陣列中，透過 id 識別出被點擊的那部 movie 資料
  // find 條件函式在找到第一個符合條件的 item 後就會停下來回傳該 item
  const movie = movies.find((movie) => movie.id === id)
  // console.log(typeof movie.id)
  // 錯誤處理：重複加入，如有，立即結束函式，並給使用者提示
  // some 條件函式只會回報陣列裡有沒有 item 通過檢查條件，回傳 true or false
  if (list.some((movie) => movie.id === id)) {
    return alert('此電影已經在收藏清單中!')
  }
  // 把 movie 推進 list 收藏清單
  list.push(movie)
  // 呼叫 localStorage.setItem('favoriteMovies')，把更新後的 list 收藏清單同步到 local storage
  localStorage.setItem('favoriteMovies', JSON.stringify(list))
  console.log(list)
}

// data-mode 切換顯示模式
function displayMode(mode) {
  // 相同 mode 則結束函式
  if (dataPanel.dataset.mode === mode) return;
  dataPanel.dataset.mode = mode;
}

// 監聽 changeMode 如果點擊 card、list 按鈕，即觸發事件 onModeClicked
changeMode.addEventListener("click", function onModeClicked(event) {
  console.log(event.target.id);
  if (event.target.matches("#card-mode-button")) {
    // 切換 card-mode
    displayMode("card-mode");
    // 顯示為當前頁數
    renderMovieList(getMoviesByPage(currentPage));
  } else if (event.target.matches("#list-mode-button")) {
    // 切換 list-mode
    displayMode("list-mode");
    // 顯示為當前頁數
    renderMovieList(getMoviesByPage(currentPage));
  }
});


// 監聽 dataPanel 如果點擊 More 按鈕，即觸發事件 onPanelClicked；如果點擊 + 按鈕，即觸發事件 addToFavorite
dataPanel.addEventListener('click', function onPanelClicked(event) {
  // 用 event.target.matches 來判斷點擊到的物件是否有包含 .btn-show-movie 的 class name
  if (event.target.matches('.btn-show-movie')) {
    // 呼叫 dataset. 來取得 user 的 id 值，將點擊事件的回傳值改成 event.target.dataset.id
    // console.log(event.target.dataset.id)
    // console.log(typeof event.target.dataset.id)
    // event.target.dataset.id 型別為字串，需轉換 Number() 與 movie.id 型別為 number 一致
    // 呼叫 showMovieModal 並傳入電影的 id 值
    showMovieModal(Number(event.target.dataset.id))
  } else if (event.target.matches('.btn-add-favorite')) {
    // 呼叫 addToFavorite 並傳入電影的 id 值
    addToFavorite(Number(event.target.dataset.id))
  }
})

// 監聽 paginator 如果點擊到 a 標籤，就需要呼叫 renderMovieList 根據指定的頁數重新渲染頁面
paginator.addEventListener('click', function onPaginatorClicked(event) {
  // 如果被點擊的不是 a 標籤(tagName)，結束這個函式
  // .tagName 在 HTML中，回傳其大寫形式
  if (event.target.tagName !== 'A') return
  console.log(event.target.dataset.page)
  // 透過 dataset 取得被點擊的頁數
  const page = Number(event.target.dataset.page)
  // 當前頁數
  currentPage = page;
  // 更新畫面
  renderMovieList(getMoviesByPage(currentPage))
})



// 監聽搜尋表單的提交 submit 按鈕，即觸發事件 onSearchFormSubmitted
searchForm.addEventListener('submit', function onSearchFormSubmitted(event) {
  // 請瀏覽器終止元件的預設行為(點擊 form 裡的 input[type="submit"] 或 button[type="submit"] 時，頁面會刷新)，把控制權交給 JavaScript
  event.preventDefault()
  // console.log(event)

  // 用 .value 取得 input 值，取得搜尋關鍵字
  // 加入錯誤處理：若使用者沒輸入東西就送出，會跳出警告訊息
  // 用 .trim() 把字串頭尾空格去掉，若使用者不小心輸入一堆空白送出，也會被視為沒有輸入東西，而收到警告訊息
  // 用 .toLowerCase() 把字串轉成小寫，方便之後比對
  const keyword = searchInput.value.trim().toLowerCase()
  // console.log(searchInput.value)

  // 作法一:用迴圈迭代：for-of
  // 當一部的電影的 title 有包含 keyword 時，就把這部電影推進 filteredMovies 陣列裡
  // for (const movie of movies) {
  //   if (movie.title.toLowerCase().includes(keyword)) {
  //     filteredMovies.push(movie)
  //   }
  // }

  // 作法二:用條件來迭代：filter
  // 用 .filter() 條件篩選，只有通過這個條件函式檢查的項目，才會被 .filter() 保留並回傳一個新的陣列 filteredMovies
  // 篩選電影 title 包含 .includes() 關鍵字 keyword
  filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(keyword)
  )

  // 錯誤處理：輸入無效(空白)字串的結果
  // 當使用者沒有輸入符合條件的關鍵字時，所有項目都不會通過篩選
  // 當使用者輸入的關鍵字輸入無效(空白)字串時，跳出警示 alert
  // if (keyword.length === 0) {
  //   return alert('Cannot find movies with keyword: ' + keyword)
  // }

  // 錯誤處理：無符合條件的結果
  // 當使用者沒有輸入符合條件的關鍵字時(filteredMovies 為空字串)，畫面顯示全部電影(在 include () 中傳入空字串，所有項目都會通過篩選）
  // 當使用者輸入的關鍵字找不到符合條件的項目時(是空字串)，跳出警示 alert
  if (filteredMovies.length === 0) {
    return alert('Cannot find movies with keyword: ' + keyword)
  }
  // 顯示為預設第 1 頁的資料
  currentPage = 1;
  // 呼叫 renderPaginator 重製分頁器，根據 filteredMovies 的長度來決定
  renderPaginator(filteredMovies.length)
  // 搜尋結果預設顯示預設第 1 頁的資料
  renderMovieList(getMoviesByPage(currentPage))
})

// 用 axios 串接 Index API
axios.get(INDEX_URL).then((response) => {
  // 取出所有電影的資料
  // console.log(response.data.results)

  // 把 API Array(80) 的內容放進 movie 空陣列裡
  // 解法一：迭代器
  // 用迭代器像 for-of，把 response.data.results 陣列中的元素一個個拿出來
  // 再使用 push 修改多個的陣列元素(按址拷貝 copied by reference)推進 movies 裡，不會觸發 const 限制(按值拷貝 copied by value)
  // for (const movie of response.data.results) {
  //   movies.push(movie)
  // }
  // console.log(movies)

  // 解法二：展開運算子
  // ... 就是展開運算子，他的主要功用是「展開陣列元素」

  // EX:用 push 方法把 movies 從空陣列變成 [1,2,3]
  // const movies = []; //空陣列，空容器
  // 方法一
  // movies.push(1, 2, 3); //傳入 3 個參數：1,2,3
  // 方法二
  // movies.push(...[1, 2, 3]); //把陣列用展開運算子打開，打開後就和方法一一模一樣

  // 直接展開 response.data.results 裡的陣列元素，讓每個元素都變成 push 方法中的一個參數，一一推進 movies 裡
  movies.push(...response.data.results)
  // console.log(movies)

  // 呼叫 renderPaginator()，並傳入 movies 的總筆數
  renderPaginator(movies.length)
  // 呼叫函式 renderMovieList，不要把全部 movies 傳進去，只要顯示當前頁數的資料就好
  renderMovieList(getMoviesByPage(currentPage))
})
  .catch(error => console.log(error))