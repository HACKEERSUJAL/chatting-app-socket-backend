import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,
    private readonly chatService: ChatService,
  ) {}

  @WebSocketServer() server: Server;
  private onlineUsers = new Map<string, string>();

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        throw new Error('No token provided');
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'secret',
      });

      client.data.userId = payload.sub;
      client.join(payload.sub);

      // Mark user as online
      this.onlineUsers.set(payload.sub, client.id);

      // Send online users to the newly connected client
      client.emit('online_users', {
        users: Array.from(this.onlineUsers.keys()),
      });

      // Notify all other users that this user is online
      client.broadcast.emit('user_online', {
        userId: payload.sub,
      });

      console.log(' User connected:', payload.sub);
    } catch (err) {
      console.error('Connection error:', err.message);
      client.emit('connection_error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (!userId) return;

    this.onlineUsers.delete(userId);

    // Notify others this user went offline
    this.server.emit('user_offline', { userId });

    console.log('⚡ User disconnected:', userId);
  }

  @SubscribeMessage('chat_opened')
  async handleChatOpened(
    @MessageBody() data: { chatPartnerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const currentUserId = client.data.userId;

      if (!data.chatPartnerId) {
        throw new Error('chatPartnerId is required');
      }

      // Mark messages as seen
      await this.chatService.markMessagesAsSeen(
        data.chatPartnerId,
        currentUserId,
      );

      // Notify the chat partner that messages were seen
      this.server.to(data.chatPartnerId).emit('message_seen', {
        receiverId: currentUserId,
      });
    } catch (error) {
      console.error('Error in chat_opened:', error);
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { chatPartnerId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const senderId = client.data.userId;

      if (!data.chatPartnerId) {
        throw new Error('chatPartnerId is required');
      }

      this.server.to(data.chatPartnerId).emit('typing', {
        senderId,
        isTyping: data.isTyping,
      });
    } catch (error) {
      console.error('Error in typing:', error);
      client.emit('error', { message: error.message });
    }
  }
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody()
    data: {
      receiverId: string;
      content: string;
      tempId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const senderId = client.data.userId;

      if (!senderId || !data.receiverId) {
        throw new Error('Sender ID and receiver ID are required');
      }

      if (!data.content || data.content.trim() === '') {
        throw new Error('Message content cannot be empty');
      }

      console.log('📥 Sending message from:', senderId, 'to:', data.receiverId);

      const message = await this.chatService.saveMessage({
        senderId,
        receiverId: data.receiverId,
        content: data.content.trim(),
      });

      // Ensure message.data exists before using
      if (!message.data) {
        throw new Error('Message saving failed, no data returned');
      }

      // Send to receiver
      this.server.to(data.receiverId).emit('new_message', message.data);

      // Send confirmation to sender with actual message ID
      if (data.tempId) {
        client.emit('message_sent', {
          tempId: data.tempId,
          actualId: message.data._id.toString(),
        });
      }

      //  Also send the actual message to sender for consistency
      client.emit('new_message', message.data);

      console.log('Message sent successfully');

      return { success: true, data: message.data };
    } catch (err: any) {
      console.error('Failed to send message:', err.message);

      // Send error back to client
      client.emit('message_error', {
        error: err.message,
        tempId: data.tempId,
      });

      return { success: false, error: err.message };
    }
  }

  @SubscribeMessage('mark_as_seen')
  async handleMarkAsSeen(
    @MessageBody() data: { chatPartnerId: string; messageIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const currentUserId = client.data.userId;

      if (!data.chatPartnerId) {
        throw new Error('chatPartnerId is required');
      }

      await this.chatService.markMessagesAsSeen(
        data.chatPartnerId,
        currentUserId,
      );

      // Notify the chat partner that their messages were seen
      this.server.to(data.chatPartnerId).emit('message_seen', {
        receiverId: currentUserId,
        messageIds: data.messageIds,
      });

      console.log(`✅ Messages marked as seen by ${currentUserId}`);
    } catch (error) {
      console.error('Error marking messages as seen:', error);
      client.emit('error', { message: error.message });
    }
  }

  // ---------------- VOICE CALL EVENTS ---------------- //

  /** Caller initiates voice call */
  @SubscribeMessage('call_user')
  handleCallUser(
    @MessageBody() data: { to: string; callerName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const from = client.data.userId;
    const targetSocketId = this.onlineUsers.get(data.to);

    if (!targetSocketId) {
      client.emit('call_failed', { reason: 'User offline' });
      return;
    }

    console.log(` ${from} (${data.callerName}) is calling ${data.to}`);
    this.server.to(targetSocketId).emit('incoming_call', {
      from,
      callerName: data.callerName || 'Unknown User',
    });
  }

  /** Receiver accepts or rejects call */
  @SubscribeMessage('answer_call')
  handleAnswerCall(
    @MessageBody() data: { to: string; accept: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const from = client.data.userId;
    const callerSocketId = this.onlineUsers.get(data.to);

    if (!callerSocketId) {
      client.emit('call_failed', { reason: 'Caller offline' });
      return;
    }

    this.server.to(callerSocketId).emit('call_accepted', {
      from,
      accept: data.accept,
    });
    if (!data.accept) {
      this.server.to(callerSocketId).emit('end_call', { from });
    }
  }

  /** WebRTC offer */
  @SubscribeMessage('webrtc_offer')
  handleWebRTCOffer(
    @MessageBody() data: { to: string; offer: any; callerName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const toSocketId = this.onlineUsers.get(data.to);
    if (toSocketId) {
      this.server.to(toSocketId).emit('webrtc_offer', {
        from: client.data.userId,
        offer: data.offer,
        callerName: data.callerName || 'Unknown User',
      });
    }
  }

  /** WebRTC answer */
  @SubscribeMessage('webrtc_answer')
  handleWebRTCAnswer(
    @MessageBody() data: { to: string; answer: any; callerName?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const toSocketId = this.onlineUsers.get(data.to);
    if (toSocketId) {
      this.server.to(toSocketId).emit('webrtc_answer', {
        from: client.data.userId,
        answer: data.answer,
        callerName: data.callerName || 'Unknown User',
      });
    }
  }

  /** ICE Candidate exchange */
  @SubscribeMessage('webrtc_ice_candidate')
  handleIceCandidate(
    @MessageBody() data: { to: string; candidate: any },
    @ConnectedSocket() client: Socket,
  ) {
    const toSocketId = this.onlineUsers.get(data.to);
    if (toSocketId) {
      this.server.to(toSocketId).emit('webrtc_ice_candidate', {
        from: client.data.userId,
        candidate: data.candidate,
      });
    }
  }

  @SubscribeMessage('end_call')
  handleEndCall(
    @MessageBody() data: { to: string },
    @ConnectedSocket() client: Socket,
  ) {
    const toSocketId = this.onlineUsers.get(data.to);
    if (toSocketId)
      this.server.to(toSocketId).emit('end_call', { from: client.data.userId });
  }
}
