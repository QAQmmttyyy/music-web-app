import React from 'react';
import { Switch, Route, Link, Redirect } from "react-router-dom";
import QueueAnim from 'rc-queue-anim';

import l_lang from 'lodash/lang';
import PlayerContext from '../../context/PlayerContext';
import SongTable from '../SongTable/SongTable.jsx';
import Tabs from '../Tabs/Tabs.jsx';

import './AlbumDetail.scss';

class AlbumDetail extends React.Component {

  constructor(props) {
    super(props);
    
    this.state = {
      albumInfo: {}
    };
  }

  componentDidMount() {
    // p0 页数 可变
    const albumUrl = `${
      process.env.PUBLIC_URL
    }/api_mock_data/album_detail/all/album-${this.albumId}.json`;

    window.fetch(albumUrl).then(
      response => response.statusText === 'OK' ? response.json() : {}
    ).then(
      data => {
        console.log(data.songlist);
        window.document.getElementById('root').scrollTo({
          top: 0,
          left: 0,
          // behavior: 'smooth'
        });
        this.setState({ albumInfo: data });
      }
    ).catch(
      reason => console.log(reason)
    );
  }

  handleClickPlayallOrAddall(funcPlayallOrAddall) {
    const songlist = l_lang.cloneDeep(this.state.albumInfo.songlist);
    funcPlayallOrAddall(songlist);
  }

  render() {
    const { location, match } = this.props;
    this.albumId = location.search.split('=')[1];

    if (this.state.albumInfo.hasOwnProperty('id')) {
      
      const {
        id,
        coverUrl,
        title,
        subTitle,
        artists,
        publishTime,
        publisher,
        songNum,
        cmtNum,
        songlist,
      } = this.state.albumInfo;

      let artistsTitle = '';
      const 
        lastArtistIdx = artists.length - 1,
        artistArr = artists.map((artist, index) => {

          const
            linkText = (
              index !== lastArtistIdx
            ) ? `${artist.name} / `
              : `${artist.name}`;
          
          artistsTitle += linkText;

          // let 
          //   artistLinkPart = '',
          //   artistlinkLocation = {};

          // if (artist.link) {
          //   artistLinkPart = artist.link.split('?');
          //   artistlinkLocation = {
          //     pathname: artistLinkPart[0],
          //     search: `?${artistLinkPart[1]}`,
          //   };
          //   return (
          //     <Link 
          //       key={index}
          //       to={artistlinkLocation}
          //     >
          //       {linkText}
          //     </Link>
          //   );            
          // }

          return (
            <a key={index}>
              {linkText}
            </a>
          );
        });

      // const tabInfo = [
      //   {
      //     to: `${match.url}/songs`,
      //     desc: `歌曲(${songNum})`,
      //   },
      //   {
      //     to: `${match.url}/cmts`,
      //     desc: `评论(${cmtNum})`,
      //   }
      // ];

      return (
        <PlayerContext.Consumer>
          {({ playAll, addAll }) => (

            <QueueAnim 
              type="bottom" 
              duration={300}
              interval={150}
            >
              <QueueAnim 
                className="ad-info" 
                key="adinfo" 
                type="bottom"
                duration={300}
                interval={50}
              >
                {/* cover */}
                <div key="cover" className="ad-info-cover">
                  <img 
                    src={`${coverUrl}?param=177y177`}
                    alt="cover"
                  />
                  <span className="msk"></span>
                </div>
                {/* title */}
                <div key="title" className="ad-info-hd">
                  {/* <span className="ad-info-hd-label">歌单</span> */}
                  <h2 className="title">{title}</h2>
                  <p className="subtitle">{subTitle}</p>
                </div>
                {/* artists */}
                <div 
                  key="artists"
                  className="ad-info-artists"
                  title={artistsTitle}
                >
                  <span>歌手：</span>
                  {artistArr}
                </div>
                {/* publishtime */}
                <div key="publishtime" className="ad-info-pubtime">
                  <span>发行时间：</span>
                  {publishTime}
                </div>
                {/* publisher */}
                {publisher ? (
                  <div key="publisher" className="ad-info-publisher">
                    <span>发行公司：</span>
                    {publisher}
                  </div>                  
                ) : null}
                {/* operation */}
                <div key="operation" className="ad-info-operation">
                  <span 
                    className="btn playall"
                    onClick={() => {this.handleClickPlayallOrAddall(playAll)}}
                  >
                    <i className="icon play"></i>
                    播放
                  </span>
                  <span 
                    className="btn addall"
                    onClick={() => {this.handleClickPlayallOrAddall(addAll)}}
                  >
                    <i className="icon add"></i>
                    添加
                  </span>
                </div>
              </QueueAnim>

              <SongTable 
                key="songlist"
                songlist={songlist}
                hasAlbum={false}
              />
              {/* <Tabs info={tabInfo}/>
              <Switch>
                <Redirect 
                  exact 
                  from={`${match.path}`} 
                  to={`${match.path}/songs`} 
                />
                <Route 
                  path={`${match.path}/songs`} 
                  render={() => {
                    window.document.getElementById('root').scrollTo({
                      top: 0,
                      left: 0,
                      // behavior: 'smooth'
                    });
                    return (
                      <SongTable 
                        songlist={songlist}
                        hasAlbum={false}
                      />
                    );
                  }}
                />
                <Route 
                  path={`${match.path}/cmts`} 
                  render={() => (<div>评论</div>)}
                />
              </Switch> */}
              
            </QueueAnim>
          )}
        </PlayerContext.Consumer>
      );
    } else {
      // TODO 占位符元素
      return (<div></div>);
    }

  }
}

export default AlbumDetail;