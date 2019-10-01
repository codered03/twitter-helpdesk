import React, { Component } from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import Pusher from "pusher-js";
import moment from "moment";
import Grid from "@material-ui/core/Grid";
import {
  ThemeProvider,
  ChatList,
  ChatListItem,
  Avatar,
  Column,
  Row,
  Title,
  Subtitle,
  Message,
  MessageList,
  MessageGroup,
  MessageText,
  TextComposer,
  IconButton,
  AddIcon,
  TextInput,
  SendButton
} from "@livechat/ui-kit";
import styled from "styled-components";
import { AppBar } from "./../";

const json = response => {
  return response.json();
};

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
`;

const ChatContainer = styled.div`
  height: calc(100vh - 64px);
  width: 100%;
`;

const ScrollableGrid = styled(Grid)`
  height: calc(100vh - 64px);
  overflow-y: scroll;
`;

class HelpDesk extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tweets: [],
      tweetThread: [],
      message: "",
      threadID: "",
      tweeted: false,
    };

    this.postThreadReply = this.postThreadReply.bind(this);
    this.updateNewStatus = this.updateNewStatus.bind(this);
  }

  componentDidMount() {
    const self = this;
    const pusher = new Pusher(process.env.REACT_APP_PUSHER_KEY, {
      cluster: "ap2",
      forceTLS: true
    });

    const channel = pusher.subscribe("chat");
    channel.bind(localStorage.getItem('username'), socketData => {
      const tweetLoaded =
        this.state.tweets.filter(tweet => tweet.id_str === socketData.id_str)
          .length > 0;
      if (!tweetLoaded) {
        const updatedTweets = [socketData, ...this.state.tweets].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        this.setState({ tweets: updatedTweets }, () => {
          this.fetchTweetThread(this.state.threadID);
        });
      }
    });

    fetch(`${process.env.REACT_APP_SERVER}/twitter/tweets`, {
      method: "post",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({
        key: localStorage.getItem("twitterHelpdesk.accessToken"),
        secret: localStorage.getItem("twitterHelpdesk.accessSecret")
      })
    })
      .then(json)
      .then(function(data) {
        data = data.sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        self.setState({ tweets: data });
      })
      .catch(function(error) {
        console.log("Request failed", error);
      });
  }

  fetchTweetThread = tweetID => {
    const { tweets } = this.state;
    const tweetsFromThread = [];
    const tweetThread = tweets.filter(tweet => {
      if (
        tweet.id_str === tweetID ||
        tweet.in_reply_to_status_id_str === tweetID
      ) {
        tweetsFromThread.push(tweet.id_str);
        return true;
      } else {
        if (tweetsFromThread.indexOf(tweet.in_reply_to_status_id_str) > -1) {
          tweetsFromThread.push(tweet.id_str);
          return true;
        }
        return false;
      }
    });
    this.setState({ tweetThread, threadID: tweetID });
  };

  postThreadReply() {
    const { message, tweetThread, threadID } = this.state;
    const self = this;
    this.setState({ tweeted: true });

    fetch(`${process.env.REACT_APP_SERVER}/twitter/reply`, {
      method: "post",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify({
        key: localStorage.getItem("twitterHelpdesk.accessToken"),
        secret: localStorage.getItem("twitterHelpdesk.accessSecret"),
        status: `@${tweetThread[0].user.screen_name} ${message}`,
        statusID: tweetThread[0].id_str,
        keywords: `@${tweetThread[0].user.screen_name},@${localStorage.getItem("username")}`,
        username: localStorage.getItem("username")
      })
    })
      .then(json)
      .then(function(data) {
        console.log("tweeted");
        const updatedTweets = [data, ...self.state.tweets].sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        );
        self.setState({ tweets: updatedTweets }, () => {
          self.fetchTweetThread(threadID);
          self.setState({ tweeted: false });
        });
      })
      .catch(function(error) {
        console.log("Request failed", error);
      });
  }

  updateNewStatus(event) {
    this.setState({ message: event.target.value });
  }

  render() {
    const { tweets, tweetThread, threadID, tweeted } = this.state;

    return (
      <ThemeProvider>
        <AppBar />
        {tweets.length === 0 ? (
          <ProgressContainer>
            <CircularProgress style={{ margin: 12 }} />
          </ProgressContainer>
        ) : (
          <ChatContainer>
            <Grid container spacing={0}>
              <ScrollableGrid item xs={4} lg={3} md={3}>
                {Chatlist(tweets, this.fetchTweetThread, threadID)}
              </ScrollableGrid>
              <ScrollableGrid
                item
                xs={8}
                lg={9}
                md={9}
                style={{ borderLeft: "1px solid #8080803d" }}
              >
                {Messagelist(tweetThread, tweeted)}
                <TextComposer
                  style={{ minHeight: 150 }}
                  onChange={this.updateNewStatus}
                  onSend={this.postThreadReply}
                >
                  <Row align="center">
                    <IconButton fit>
                      <AddIcon />
                    </IconButton>
                    <TextInput />
                    <SendButton fit />
                  </Row>
                </TextComposer>
              </ScrollableGrid>
            </Grid>
          </ChatContainer>
        )}
      </ThemeProvider>
    );
  }
}

const Chatlist = (tweets, fetchTweetThread, threadID) => {
  return (
    <ChatList>
      {tweets
        .filter(tweet => tweet.in_reply_to_status_id === null)
        .map(tweet => {
          return (
            <ChatListItem
              active={threadID === tweet.id_str}
              key={Number(tweet.id_str)}
              onClick={() => fetchTweetThread(tweet.id_str)}
            >
              <Avatar
                letter={tweet.user.name.split("")[0]}
                imgUrl={tweet.user.profile_image_url_https}
              />
              <Column>
                <Row justify>
                  <Title ellipsis>{tweet.user.name.split(" ")[0]}</Title>
                  <Subtitle nowrap>
                    {moment(new Date(tweet.created_at)).format("LT")}
                  </Subtitle>
                </Row>
                <Subtitle ellipsis>{tweet.text}</Subtitle>
              </Column>
            </ChatListItem>
          );
        })}
    </ChatList>
  );
};

const Messagelist = (tweetThread, tweeted) => {
  const username = localStorage.getItem("username");

  return (
    <MessageList active>
      {tweetThread.map((thread, index) => (
        <MessageGroup
          avatar={thread.user.profile_image_url_https}
          onlyFirstWithMeta
          key={index}
          isOwn={username === thread.user.screen_name}
        >
          <Message
            authorName={
              username === thread.user.screen_name ? "You" : thread.user.name
            }
            date={`${moment(new Date(thread.created_at)).format(
              "ll"
            )} at ${moment(new Date(thread.created_at)).format("LT")}`}
          >
            <MessageText>{thread.text}</MessageText>
          </Message>
        </MessageGroup>
      ))}
      {tweeted &&
        <span>loading...</span>}
    </MessageList>
  );
};

export default HelpDesk;
