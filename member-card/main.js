// MVC (Model-View-Controller)

// 設定遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished',
};

// TODO: View 渲染卡片
// 花色圖片
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png', // 梅花
];

const view = {
  // 取得牌背
  getCardElement(index) {
    // HTML template
    // 加入 back(牌背)、data-set
    return `<div class="card back" data-index='${index}'></div>`;
  },

  // 取得牌面
  // 生成卡片內容，包括花色和數字
  getCardContent(index) {
    // index 0 - 12：黑桃 number 1 - 13
    // index 13 - 25：愛心 number 1 - 13
    // index 26 - 38：方塊 number 1 - 13
    // index 39 - 51：梅花 number 1 - 13
    // index 除以 13後的餘數(%) + 1
    const number = this.transformNumber((index % 13) + 1);
    // Math.floor 無條件捨去
    const symbols = Symbols[Math.floor(index / 13)];
    // HTML template
    return `
    <!-- display panel -->
    <p>${number}</p>
    <img src="${symbols}">
    <p>${number}</p>
    `;
  },

  // 1、11、12、13轉換撲克牌中的 A、J、Q、K，而其餘 2 - 10，則回傳原數字
  transformNumber(number) {
    // switch 比對一個表達式裡頭的值是否符合 case 條件，然後執行陳述句；都不符合上述 case 條件，則執行 default 條件
    switch (number) {
      case 1:
        return 'A';
      case 11:
        return 'J';
      case 12:
        return 'Q';
      case 13:
        return 'K';
      default:
        return number;
    }
  },

  // 選出 #cards 並抽換內容
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards');
    // Array.from(Array(52).keys()) 為 0～51 的迭代器
    // Array.from() 從類陣列（array-like）或是可迭代（iterable）物件建立一個新的 Array
    // Array.keys() 回傳一個包含陣列中的每一個索引之鍵（keys）
    // 用 map() 迭代陣列，並依序將數字丟進 view.getCardElement()，會變成有 52 張卡片的陣列，接著要用 join("") 把陣列合併成一個大字串
    // map() 原陣列的每一個元素經由函式運算後，回傳一個新的陣列
    // join() 將陣列中所有的元素連接、合併成一個字串，並回傳
    // Array.from 替換成 utility.getRandomNumberArray 洗牌演算法，要由 controller 呼叫再替換成 indexes
    rootElement.innerHTML = indexes
      .map((index) => this.getCardElement(index))
      .join('');
  },

  // 翻牌
  // ... 展開運算子 (spread operator)，可以把陣列展開成個別的值，也可以把個別的值蒐集起來變成陣列
  flipCards(...cards) {
    // console.log(card)
    // 用 map 來迭代
    cards.map((card) => {
      if (card.classList.contains('back')) {
        // 回傳(翻開)正面(remove back)
        card.classList.remove('back');
        // 運用 card.dataset.index 來運算卡片內容
        card.innerHTML = this.getCardContent(Number(card.dataset.index));
        return;
      }
      // 回傳(翻回)背面(add back)
      card.classList.add('back');
      // 內容清除
      card.innerHTML = null;
    });
  },

  // 配對成功
  pairCards(...cards) {
    cards.map((card) => {
      // 回傳維持正面並改變樣式(add paired)
      card.classList.add('paired');
    });
  },

  // 渲染分數
  renderScore(score) {
    document.querySelector('.score').textContent = `
    Score: ${score}
    `
  },

  // 渲染嘗試次數
  renderTriedTimes(times) {
    document.querySelector('.tried').textContent = `
    You've tried: ${times} times
    `
  },

  // 動畫
  appendWrongAnimation(...cards) {
    cards.map((card) => {
      // 執行動畫(add wrong)
      card.classList.add('wrong')
      // 監聽動畫結束事件 (animationend)
      // 動畫執行一次之後，需卸載這個監聽器 {once: true} ，則刪除動畫(remove wrong)
      card.addEventListener('animationend', event =>
        event.target.classList.remove('wrong'), { once: true })
    })
  },

  // 遊戲結束畫面
  showGameFinished() {
    // 新建 <div>
    const div = document.createElement('div')
    // class add completed
    div.classList.add('completed')
    // HTML template
    div.innerHTML = `
    <p>Complete!</p> 
    <p>Score: ${modal.score}</p>
    <p>You've tried: ${modal.triedTimes} times</p>
    `
    const header = document.querySelector('#header')
    // A.before(B) 為 B 在 A 的前面
    header.before(div)
  }
};

// TODO: modal 集中管理資料
const modal = {
  // 暫存牌組(檢查配對與否)
  revealedCards: [],

  // 檢查翻開的兩張卡片是否相同(index % 13 的餘數相同)
  isRevealedCardsMatched() {
    return (
      this.revealedCards[0].dataset.index % 13 ===
      this.revealedCards[1].dataset.index % 13
    );
  },

  // 分數與嘗試次數
  score: 0,
  triedTimes: 0
};

// TODO: controller 統一發派動作
const controller = {
  // 初始狀態為等待翻開第一張牌(還沒翻牌)
  currentState: GAME_STATE.FirstCardAwaits,

  // 生成全部卡片
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52));
  },

  // 依遊戲狀態發派工作給 view、modal
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      // 執行完 return 函數則終止
      return;
    }
    switch (this.currentState) {
      // 等待翻開第一張牌的狀態
      case GAME_STATE.FirstCardAwaits:
        // 翻牌
        view.flipCards(card);
        // 推進暫存牌組，以便檢查配對
        modal.revealedCards.push(card);
        // 進入等待翻開第二張牌的狀態
        this.currentState = GAME_STATE.SecondCardAwaits;
        // break 為終止循環，不會繼續往下執行
        break;
      // 等待翻開第二張牌的狀態
      case GAME_STATE.SecondCardAwaits:
        // 嘗試次數 +1
        view.renderTriedTimes(++modal.triedTimes)
        view.flipCards(card);
        modal.revealedCards.push(card);
        console.log(modal.isRevealedCardsMatched());
        // 判斷配對是否成功
        if (modal.isRevealedCardsMatched()) {
          // 分數 +10
          view.renderScore(modal.score += 10)
          // 配對成功
          this.currentState = GAME_STATE.CardsMatched;
          // 不去呼叫 flipCard，卡片就會維持翻開，配對暫存牌組的牌(兩張替換成 ...)
          view.pairCards(...modal.revealedCards);
          // 清空暫存牌組(配對結束)
          modal.revealedCards = [];
          // 判斷分數是否達到260滿分
          if (modal.score === 260) {
            console.log('showGameFinished')
            // 遊戲結束的狀態
            this.currentState = GAME_STATE.GameFinished
            // 呼叫遊戲結束畫面
            view.showGameFinished()
            return
          }
          // 重回遊戲初始狀態
          this.currentState = GAME_STATE.FirstCardAwaits;
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed;
          // 配對失敗則呼叫動畫
          view.appendWrongAnimation(...modal.revealedCards)
          // setTimeout(function, delay)
          // 設定定時器為延遲 1 秒(單位為毫秒，1000 毫秒為 1 秒)後，重置卡片
          setTimeout(this.resetCards, 1000);
        }
        break;
    }
    console.log('this.currentState:', this.currentState);
    console.log(
      'revealedCards:',
      modal.revealedCards.map((card) => card.dataset.index)
    );
  },

  // 重置卡片
  resetCards() {
    // 翻回暫存牌組的牌(兩張替換成 ...)
    view.flipCards(...modal.revealedCards);
    // 清空暫存牌組(配對結束)
    modal.revealedCards = [];
    // 重回遊戲初始狀態
    controller.currentState = GAME_STATE.FirstCardAwaits;
  },
};

// 洗牌演算法(Fisher-Yates Shuffle)
const utility = {
  // count 為陣列的長度(幾張牌)
  getRandomNumberArray(count) {
    // 生成一個長度為 count 的連續數字陣列
    const number = Array.from(Array(count).keys());
    // 洗牌從最底部的卡牌開始，將它抽出來與前面的隨機一張牌 (包含自己) 交換，做到頂部的第二張牌為止
    for (let index = number.length - 1; index > 0; index--) {
      // 找到一個隨機項目
      let randomIndex = Math.floor(Math.random() * (index + 1));
      // 交換陣列元素
      [number[index], number[randomIndex]] = [
        number[randomIndex],
        number[index],
      ];
    }
    return number;
  },
};

// 取代 view.displayCards()，不要讓 controller 以外的內部函式暴露在 global 的區域
controller.generateCards();

// 監聽每張卡片，點擊卡牌翻面
// 先使用 querySelectorAll 來抓到所有與 .card 選擇器匹配的元素，此時會回傳一個 NodeList，再使用 forEach 來迭代回傳值
document.querySelectorAll('.card').forEach((card) => {
  card.addEventListener('click', (event) => {
    // console.log(card)
    // 呼叫翻牌 view.flipCard(card) 要改由 controller 呼叫，替換成 controller.dispatchCardAction(card)
    controller.dispatchCardAction(card)
  });
});