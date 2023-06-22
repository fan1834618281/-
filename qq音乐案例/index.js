// 参考案例：http://zxt_team.gitee.io/qq-music-player/
FastClick.attach(document.body);

(async function () {
  const baseBox = document.querySelector(".header_box .base")
  const player_button = document.querySelector(".player_button")
  const wrapperBox = document.querySelector(".wrapper")
  const footer_box = document.querySelector(".footer_box")
  const durationBox = footer_box.querySelector(".duration")
  const alreadyBox = footer_box.querySelector(".already")
  const currentBox = footer_box.querySelector(".current")
  const mark_imageBox = document.querySelector(".mark_image")
  const loading_Box = document.querySelector(".loading_box")
  const audioBox = document.querySelector("#audioBox")
  let wrapperList = [],
    timer = null,
    matchNum = 0//记录历史匹配数量


  /*音乐控制 */
  const format = function format(time) {
    /*   console.log(time); */
    let minutes = Math.floor(time / 60),
      seconds = Math.round(time - minutes * 60)
    minutes = minutes < 10 ? "0" + minutes : "" + minutes
    seconds = seconds < 10 ? "0" + seconds : "" + seconds
   
    return {
      minutes,
      seconds
    }
  }
  const handle = function handle() {
    let pH = wrapperList[0].offsetHeight
    /* console.log(pH); */
    //进度条，
    let { currentTime, duration } = audioBox
    console.log(currentTime, duration);
    if (isNaN(currentTime) || isNaN(duration)) return

    //播放结束
    if (currentTime >= duration) {
      playend()
      return
    }

    let { minutes: currentTimeMinutes, seconds: currentTimeSeconds } = format(currentTime),
      { minutes: durationMinutes, seconds: durationSeconds } = format(duration)
    let ratio = Math.round(currentTime / duration * 100)

    currentBox.innerHTML = `${currentTimeMinutes}:${currentTimeSeconds}`
    durationBox.innerHTML = `${durationMinutes}:${durationSeconds}`
    alreadyBox.style.width = `${ratio}%`

    //控制歌词

    let matchs = wrapperList.filter(item => {
      let minutes = item.getAttribute("minutes")
      let seconds = item.getAttribute("seconds")
      return minutes === currentTimeMinutes && seconds === currentTimeSeconds
    })
    if (matchs.length > 0) {
      // 让匹配的段落有选中样式，移出其他的样式
      wrapperList.forEach(item => item.className = "")
      matchs.forEach(item => item.className = "active")
   
      //控制移动
      matchNum += matchs.length
      if (matchNum > 3) {
       
        let offset = (matchNum - 3) * pH
        wrapperBox.style.transform = `translateY(${-offset}px)`
      }
    }

  }
  //结束时
  const playend = function playend() {

    clearInterval(timer)
    timer = null
    currentBox.innerHTML = "00:00"
    alreadyBox.style.width = "0%"
    wrapperBox.style.transform ="translateY(0)"
    wrapperList.forEach(item=>item.className="")
    matchNum = 0
    player_button.className ="player_button"
  }
  player_button.addEventListener("click", function () {
    if (audioBox.paused) {
      //当前是播放的
      audioBox.play()
      player_button.className = "player_button move"
      handle()
      if (!timer) timer = setInterval(handle, 1000)

      return
    }
    //当前是播放的，让其暂停
    audioBox.pause()
    player_button.className = "player_button"
    clearInterval(timer)
    timer = null
  })

  //绑定数据
  const bindLyric = function bindLyric(lyric) {
    //处理歌词部分的特殊符号
    lyric = lyric.replace(/&#(\d+);/g, (value, $1) => {
      let instead = value
      switch (+$1) {
        case 32:
          instead = " "
          break
        case 40:
          instead = "("
          break
        case 41:
          instead = ")"
          break
        case 45:
          instead = "-"
          break
        default:

      }
      return instead;

    })
  /*   console.log(lyric); */

    //解析歌词
    let arr = []
    lyric.replace(
      /\[(\d+)&#58;(\d+)&#46;(?:\d+)\]([^&#?]+)(?:&#10;)?/g,
      (_, $1, $2, $3) => {
      /*   console.log($1, $2, $3) */
        arr.push(
          {
            minutes: $1,
            seconds: $2,
            text: $3
          }
        )
      }
    )
    //歌词绑定
    let str = ``
    arr.forEach(({ minutes, seconds, text }) => {
      str += `<p  class="active" minutes="${minutes}" seconds="${seconds}"> ${text}</p>`
    })
    wrapperBox.innerHTML = str
    //获取所有p标签
    wrapperList = Array.from(wrapperBox.querySelectorAll("p"))

  }
  const binding = function binding(data) {
    let { title, author, duration, pic, audio, lyric } = data
    //@1绑定头部基本信息
    baseBox.innerHTML = `
    <div class="cover">
     <img src="${pic}" alt="">
    </div>
    <div class="info">
      <h2 class="title">
      ${title}
      </h2>
      <h3 class="author">${author}</h3>
    </div>`
    //@2杂
    durationBox.innerHTML = duration
    mark_imageBox.style.backgroundImage = `url(${pic})`
    audioBox.src = audio

    /*  */

    //@3绑定歌词信息
    bindLyric(lyric)

    //关闭loading层
    loading_Box.style.display = "none"
  }

  //先服务器发请求获取数据
  try {
    let { code, data } = await API.queryLyric()
    if (+code === 0) {
      //请求成功，网络层和业务层都成功
      binding(data)
      return
    }
  } catch (error) { console.log(error); }
  //请求失败
  alert("网络繁忙,请刷新")
})()