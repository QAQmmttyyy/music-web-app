import React from 'react';

import PlayerContext from '../../context/PlayerContext';
import './Player.scss';

class Player extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modeIndex: 0,
      volumePercent: '100%',
      duration: '00:00',
      curTime: '00:00',
      loadProgress: '0',
      playProgress: '0',
      isPauseIco: false,
      isOpen: false,
    };
    this.audioRef = React.createRef();
    this.progressFrontRef = React.createRef();
    this.volumeBarFrontRef = React.createRef();

    this.curSongIndex = -1;
    this.audioAmount = 0;
    this.isPause = true; // 指示 进行播放还是暂停
    this.songUrlApi = 'https://music.163.com/song/media/outer/url?id='; // ?id=350909 会返回一个重定向响应
    this.currentSong = {};

    this.progressBarState = {
      pageX: 0,
      entireWidth: 0,
      progressBtnCenterOffsetToCursorX: 0,
      progress: 0,
      curTime: 0,
    };
    this.volumeBarState = {
      pageX: 0,
      entireWidth: 0,
      volumeBarBtnCenterOffsetToCursorX: 0,
      volume: 1.0, // 暂存音量值
    };
    this.playMode = [
      {
        desc: '列表循环',
        className: 'loop-mode',
      },
      {
        desc: '单曲循环',
        className: 'single-mode',
      },
      {
        desc: '随机播放',
        className: 'random-mode',
      }
    ];
  }
  
  componentDidUpdate() {
    console.log('componentDidUpdate');
    if (this.isNoAudio()) {
      return;
    }
    if (this.isPause) {
      if (!(this.audioRef.current.paused)) {
        this.pauseAudio();
      }
    } else {
      if (this.audioRef.current.paused) {
        this.playAudio();
      }
    }
  }

  playAudio() {
    this.audioRef.current.play().then(() => {
      console.log('play.then');
      this.setState({ isPauseIco: true });
    }, (reason) => {
      console.log(reason);
    });
  }

  pauseAudio() {
    this.audioRef.current.pause();
    this.setState({ isPauseIco: false });
  }

  // User ev handler-left-right control
  handleClickPlayBtn(funcPlay, funcPause) {
    if (this.isNoAudio()) {
      return;
    }
    if (this.audioRef.current.paused) {
      const index = this.curSongIndex;
      funcPlay(index);
    } else {
      funcPause();
    }
  }

  handleClickPrevBtn(funcPlay) {
    if (this.isNoAudio()) {
      return;
    }
    this.setState({ loadProgress: '0', playProgress: '0' });
    const index = this.getIndex(true);
    funcPlay(index);
  }

  handleClickNextBtn(funcPlay) {
    if (this.isNoAudio()) {
      return;
    }
    const index = this.getIndex();
    this.setState({ loadProgress: '0', playProgress: '0' });
    funcPlay(index);
  }

  handleClickVolumeBtn() {
    const volume = this.volumeBarState.volume;
    let audioElem = this.audioRef.current;

    audioElem.volume = audioElem.volume ? 0 : (volume ? volume : 1);
    // this.setState({ volumePercent: `${audioElem.volume * 100}%` });
  }

  handleClickModeBtn() {
    const nextIndex = (this.state.modeIndex + 1) % this.playMode.length;

    this.audioRef.current.loop = nextIndex === 1 ? true : false;
    this.setState({ modeIndex: nextIndex });
  }

  handleClickListBtn() {
    this.setState((state) => ({
      isOpen: !state.isOpen
    }));
  }

  // User ev handler-progressbar
  handleMouseDownProgBtn(funcPlay, funcPause, ev) {
    if (this.isNoAudio()) {
      return;
    }

    ev.preventDefault();

    const 
      target = ev.currentTarget,
      progressFront = this.progressFrontRef.current,
      state = this.progressBarState;

    state.pageX = this.getElemClientPageLeft(progressFront);
    state.entireWidth = progressFront.parentElement.clientWidth;
    state.progressBtnCenterOffsetToCursorX = 
        this.getElemClientPageLeft(target) + 
        (target.offsetWidth / 2) - 
        ev.pageX;
  
    // bind 鼠标脱离progressBtn也起作用
    const doc = window.document;
    doc.onmousemove = this.handleMouseMoveProgBtn.bind(this);
    doc.onmouseup = this.handleMouseUpProgBtn.bind(this, funcPlay);

    funcPause();
  }

  handleMouseMoveProgBtn(ev) {
    const
      prevCurTime = this.state.curTime,
      duration = this.audioRef.current.duration,
      state = this.progressBarState;
    // console.log(duration);
    const entireWidth = state.entireWidth;

    let
      progressFrontWidth = 
        ev.pageX + state.progressBtnCenterOffsetToCursorX - state.pageX;

    if (progressFrontWidth < 0) {
      progressFrontWidth = 0;
    } else if (progressFrontWidth > entireWidth) {
      progressFrontWidth = entireWidth;
    }

    state.progress = parseFloat((progressFrontWidth / entireWidth).toFixed(3));
    state.curTime = parseFloat((state.progress * duration).toFixed(6));

    const
      curTimeStr = this.timeFormat(state.curTime),
      progress = `${state.progress * 100}%`;

    if (prevCurTime !== curTimeStr) {
      this.setState({
        curTime: curTimeStr,
        playProgress: progress
      });
    } else {
      this.setState({ playProgress: progress });
    }
  }

  handleMouseUpProgBtn(funcPlay, ev) {
    ev.preventDefault();

    const 
      doc = window.document,
      state = this.progressBarState,
      audio = this.audioRef.current,
      index = this.curSongIndex;

    doc.onmousemove = null;
    doc.onmouseup = null;

    if (state.progress < 1) {
      audio.currentTime = state.curTime;
    } else if (state.progress === 1) {
      audio.currentTime = state.curTime - 0.1;
    }

    funcPlay(index);
  }

  // volume
  handleMouseDownVolumeBarBtn(ev) {
    ev.preventDefault();

    const 
      target = ev.currentTarget,
      volumeBarFront = this.volumeBarFrontRef.current,
      state = this.volumeBarState;

    state.pageX = this.getElemClientPageLeft(volumeBarFront);
    state.entireWidth = volumeBarFront.parentElement.clientWidth;
    state.volumeBarBtnCenterOffsetToCursorX = 
        this.getElemClientPageLeft(target) + 
        (target.offsetWidth / 2) - 
        ev.pageX;
  
    // bind 鼠标脱离volumeBarBtn也起作用
    const doc = window.document;
    doc.onmousemove = this.handleMouseMoveVolumeBarBtn.bind(this);
    doc.onmouseup = this.handleMouseUpVolumeBarBtn.bind(this);
  }

  handleMouseMoveVolumeBarBtn(ev) {
    const state = this.volumeBarState;

    const entireWidth = state.entireWidth;

    let volumeBarFrontWidth = ev.pageX + 
          state.volumeBarBtnCenterOffsetToCursorX - state.pageX;

    if (volumeBarFrontWidth < 0) {
      volumeBarFrontWidth = 0;
    } else if (volumeBarFrontWidth > entireWidth) {
      volumeBarFrontWidth = entireWidth;
    }

    state.volume = volumeBarFrontWidth / entireWidth;
    this.audioRef.current.volume = state.volume;
    // this.setState({ volumePercent: `${state.volume * 100}%` });
  }

  handleMouseUpVolumeBarBtn(ev) {
    ev.preventDefault();

    const doc = window.document;

    doc.onmousemove = null;
    doc.onmouseup = null;
  }

  // Audio ev handle
  handleVolumeChange() {
    // 这样就不能给volume bar 添加transition
    this.setState({ volumePercent: `${this.audioRef.current.volume * 100}%` });
  }

  handleDurationChange() {
    console.log('handleDurationChange');
    this.setState({
      duration: this.timeFormat(this.audioRef.current.duration),
      playProgress: '0',
      curTime: '00:00'
    });
  }

  handleLoadProcess(ev) {
    const { buffered, duration } = this.audioRef.current;

    let loadProgress = '';

    if (buffered.length === 1) {
      console.log(buffered, buffered.start(0), buffered.end(0), duration);
      loadProgress = `${(buffered.end(0) / duration * 100).toFixed(1)}%`;
    } else {
      const index = buffered.length - 1;
      loadProgress = `${(buffered.end(index) / duration * 100).toFixed(1)}%`;
    }
    this.setState({ loadProgress: loadProgress });
  }

  handleTimeUpdate() {
    const
      old = this.state.curTime,
      duration = this.audioRef.current.duration,
      currentTime = this.audioRef.current.currentTime;

    const
      curTimeStr = this.timeFormat(currentTime),
      progress = `${(currentTime / duration * 100).toFixed(1)}%`;
  
    if (old !== curTimeStr) {
      this.setState({
        curTime: curTimeStr,
        playProgress: progress
      });
    } else if (currentTime === duration) {
      this.setState({ playProgress: progress });
    }
  }

  handleEnded(funcPlay) {
    const index = this.getIndex();
    this.setState({ loadProgress: '0', playProgress: '0' });
    funcPlay(index);
  }

  handleAudioError() {
    const audioElem = this.audioRef.current;
    console.log(audioElem.error);
    
    // TODO 完善无版权歌曲处理
    if (audioElem.error.code === 2) {
      audioElem.load();
      audioElem.currentTime = parseFloat(this.state.playProgress) / 100;
      console.log(this.state.playProgress);
    }
  }

  // Util
  isNoAudio() {
    return (this.audioAmount === 0 ? true : false);
  }

  timeFormat(timeNum) {// mm:ss
    const minutes = parseInt(timeNum / 60),  // 商
          seconds = parseInt(timeNum % 60),  // 余数
          minStr = minutes < 10 ? `0${minutes}` : `${minutes}`,
          secStr = seconds < 10 ? `0${seconds}` : `${seconds}`,
          curTimeStr = `${minStr}:${secStr}`;
    return curTimeStr;
  }

  getIndex(isPrev) {
    if (isPrev === undefined) {
      isPrev = false;
    }
    let index = 0;
    switch (this.state.modeIndex) {
      case 0:
      case 1:
        if (isPrev) {
          index = (
              this.curSongIndex - 1 + this.audioAmount
            ) % this.audioAmount;
        } else {
          index = (this.curSongIndex + 1) % this.audioAmount;
        }
        break;
      case 2:
        index = parseInt(Math.random() * this.audioAmount);
        break;
      default:
        break;
    }
    return index;
  }

  getElemClientPageLeft(element){
    let wholeLeft = 0;  // elem client left to page
    let parent = element;
    while(parent){
      wholeLeft += parent.offsetLeft + (
          parent.offsetWidth - parent.clientWidth) / 2;
      parent = parent.offsetParent;
    }
    return wholeLeft;
  }

  render() {
    return (
      <PlayerContext.Consumer>
        {({ playerState, play, pause }) => {
          const {
            playingList,
            currentSong,
            curSongIndex,
            isPause,
          } = playerState;

          this.curSongIndex = curSongIndex;
          this.audioAmount = playingList.length;
          this.isPause = isPause;
          this.currentSong = currentSong;

          const volumeBtnCls = `btn ${
            parseFloat(this.state.volumePercent) ? 'volume' : 'muted'
          }`;

          return (
            <div className="audio-controls-panel">
              {/* music */}
              <audio 
                ref={this.audioRef}
                src={
                  currentSong.link ? `${this.songUrlApi}${currentSong.id}` : ''
                }
                onVolumeChange={() => this.handleVolumeChange()}
                onDurationChange={() => this.handleDurationChange()}
                onProgress={(ev) => this.handleLoadProcess(ev)}
                onTimeUpdate={() => this.handleTimeUpdate()}
                onEnded={() => this.handleEnded(play)}
                onError={() => this.handleAudioError()}
              >
              </audio>

              {/* prev play/pause next */}
              <span 
                className="btn prev"
                onClick={() => this.handleClickPrevBtn(play)}
              >
                prev
              </span>

              <span 
                className={
                  'btn play' + (this.state.isPauseIco ? ' pause' : '')
                }
                onClick={() => this.handleClickPlayBtn(play, pause)}
              >
                play|pause
              </span>

              <span 
                className="btn next"
                onClick={() => this.handleClickNextBtn(play)}
              >
                next
              </span>
          
              {/* current-time */}
              <div className="played-time">
                {this.state.curTime}
              </div>

              {/* progress */}
              <div className="progress">
                <div 
                  className="progress-behind"
                  style={{ width: this.state.loadProgress }}
                >
                </div>
                <div 
                  ref={this.progressFrontRef}
                  className="progress-front"
                  style={{ width: this.state.playProgress }}
                >
                  <i 
                    className="progress-btn f-right"
                    onMouseDown={
                      (ev) => this.handleMouseDownProgBtn(play, pause, ev)
                    }
                  ></i>
                </div>
              </div>

              {/* remaining-time */}
              <div className="whole-time">
                {this.state.duration}
              </div>
              
              {/* volume */}
              <div className="volume-wrap">
                {/* volume btn */}
                <span 
                  className={volumeBtnCls}
                  onClick={() => this.handleClickVolumeBtn()}
                >
                  volume
                </span>
                {/* volumn bar */}
                <div className="volume-bar">
                  <div 
                    className="volume-bar-front"
                    style={{ width: this.state.volumePercent }}
                    ref={this.volumeBarFrontRef}
                  >
                    <i 
                      className="volume-bar-btn f-right"
                      onMouseDown={(ev) => this.handleMouseDownVolumeBarBtn(ev)}
                    ></i>
                  </div>
                </div>
              </div>

              {/* mode */}
              <div 
                className={
                  'btn ' + this.playMode[this.state.modeIndex].className
                }
                onClick={() => this.handleClickModeBtn()}
              >
                mode
              </div>

              {/* list-btn */}
              <div 
                className="list-btn-wrap"
                onClick={() => this.handleClickListBtn()}
              >
                <i className="btn list-btn"></i>
                <span className="songs-num">
                  { this.audioAmount ? this.audioAmount : '' }
                </span>
              </div>

              {/* 播放列表 */}
              <div className={
                'playlist-panel' + (this.state.isOpen ? '' : ' dis-hide')
              }>
                <ul>
                  {playingList.map(song => (
                    <li 
                      key={song.id}
                      className={currentSong.id === song.id ? 'cur-play' : ''}
                    >
                      {song.name}-{song.artists.map(val => val.name).join('/')}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        }}
      </PlayerContext.Consumer>
    );
  }
}

export default Player;