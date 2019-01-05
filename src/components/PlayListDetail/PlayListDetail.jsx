import React from 'react';
import { Link } from "react-router-dom";

import PlayerContext from '../../context/PlayerContext';
import SongTable from './SongTable/SongTable.jsx';

import './PlaylistDetail.scss';

class PlayListDetail extends React.Component {

  constructor(props) {
    super(props);
    // 动态版从API取数据。
    this.state = {
      plDetail: {}
    };
    this.plID = '';
  }

  componentDidMount() {
    // p0 页数 可变
    const pldUrl = `${
      process.env.PUBLIC_URL
    }/api_mock_data/playlist/p0/pl-${this.plID}.json`;

    window.fetch(pldUrl).then(
      response => response.statusText === 'OK' ? response.json() : {}
    ).then(
      data => {
        console.log(data.songlist);
        this.setState({ plDetail: data });
      }
    ).catch(
      reason => console.log(reason)
    );
  }

  handleClickPlayallOrAddall(func) {
    func(this.state.plDetail.songlist);
  }

  render() {
    const { location } = this.props;
    this.plID = location.search.split('=')[1];

    if (this.state.plDetail.hasOwnProperty('id')) {
      
      const {
        id,
        coverUrl,
        title,
        author,
        publishTime,
        tags,
        intro,
        songNum,
        playNum,
        cmtNum,
        songlist,
      } = this.state.plDetail;
  
      const playCount = playNum >= 10000 ? `${parseInt(playNum / 10000)}万` : playNum;
      const authorLinkParts = author.link.split('?');

      return (
        
        <PlayerContext.Consumer>
          {({ playerState, playAll, addAll }) => (
            <React.Fragment>
              <div className="pld-info">
                {/* cover */}
                <img 
                  src={`${coverUrl}?param=198y198`}
                  className="pld-info-cover"
                  alt="cover"
                />
                {/* title */}
                <div className="pld-info-hd">
                  <span className="pld-info-hd-label">歌单</span>
                  <h2 className="pld-info-hd-title">{title}</h2>
                  <div className="pld-info-hd-count">
                    <span>播放量</span>
                    <span>{playCount}</span>
                  </div>
                </div>
                {/* author */}
                <div className="pld-info-author">
                  <Link to={{
                      pathname: authorLinkParts[0],
                      search: authorLinkParts[1],
                    }}
                  >
                    <img 
                      className="pld-info-author-avatar"
                      src={`${author.avatarUrl}?param=30y30`} 
                      alt="avatar"/>
                    <span className="pld-info-author-name">
                      {author.name}
                    </span>
                  </Link>
                  <span className="pld-info-author-pubtime">
                    {publishTime}
                  </span>
                </div>
                {/* operation */}
                <div className="pld-info-operation">
                  <span 
                    className="pld-info-operation-btn pld-info-operation-playall"
                    onClick={() => {this.handleClickPlayallOrAddall(playAll)}}
                  >
                    播放全部
                  </span>
                  <span 
                    className="pld-info-operation-btn pld-info-operation-addall"
                    onClick={() => {this.handleClickPlayallOrAddall(addAll)}}
                  >
                    +
                  </span>
                </div>
                {/* tags */}
                <p className="pld-info-tags">
                  <span>标签：</span>
                  {tags.map((tag, index) => {
                    const parts = tag.link.split('?');
                    return (
                      <Link
                        key={index}
                        to={{ pathname: parts[0], search: parts[1] }}
                      >
                        {tag.tagName}
                      </Link>
                    );
                  })}
                </p>
                {/* intro */}
                <p className="pld-info-intro">
                  <span>简介：</span>
                  {intro.slice(3)}
                </p>
              </div>
              <SongTable songlist={songlist}/>
            </React.Fragment>
          )}
        </PlayerContext.Consumer>
      );
    } else {
      // TODO 占位符元素
      return (<div>加载中...</div>);
    }

  }
}

export default PlayListDetail;
