import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chat } from './chat';
import { ConversationsService } from './conversations.service';
import { ChatUserType } from './types';

describe('Chat', () => {
  let component: Chat;
  let fixture: ComponentFixture<Chat>;
  let conversationsService: jasmine.SpyObj<ConversationsService>;

  const mockConversations: ChatUserType[] = [
    {
      id: 'chat1',
      name: 'Test User',
      lastMessage: 'Hello world',
      time: 'Now',
      unread: 0,
    },
  ];

  beforeEach(async () => {
    conversationsService = jasmine.createSpyObj('ConversationsService', ['getConversations']);
    conversationsService.getConversations.and.returnValue(Promise.resolve(mockConversations));

    await TestBed.configureTestingModule({
      imports: [Chat],
      providers: [
        { provide: ConversationsService, useValue: conversationsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Chat);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.activeChatId).toBe('chat1');
  });
});
