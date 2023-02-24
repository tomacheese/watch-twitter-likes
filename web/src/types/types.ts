export interface User {
  userId: string
  screenName: string
  createdAt: string
}

export interface Media {
  rowId: number
  type: string
  mediaId: string
  urlType: string
  extension: string
  size: string
  width: number
  height: number
  createdAt: string
  url: string
}

export interface Target {
  userId: string
  name: string
  threadId: string
  createdAt: string
}

export interface Tweet {
  tweetId: string
  user: User
  tags: string[]
  text: string
  media: Media
  target: Target
}

export interface Item {
  rowId: number;
  createdAt: string;
  tweet: Tweet;
  media: Media[];
  target?: Target
}
