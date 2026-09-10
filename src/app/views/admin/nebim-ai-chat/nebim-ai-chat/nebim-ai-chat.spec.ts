import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NebimAiChatPage } from './nebim-ai-chat';

describe('NebimAiChatPage', () => {
  let component: NebimAiChatPage;
  let fixture: ComponentFixture<NebimAiChatPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NebimAiChatPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NebimAiChatPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
