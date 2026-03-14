import {Component, EventEmitter, Input, Optional, Output} from '@angular/core';
import {NgbActiveOffcanvas, NgbOffcanvasModule} from '@ng-bootstrap/ng-bootstrap';
import {ChatService} from '@/app/views/apps/chat/chat.service';
import {generateInitials} from '@/app/utils/string-utils';
import {SimplebarAngularModule} from 'simplebar-angular';
import {NgIcon} from '@ng-icons/core';
import {FormsModule} from '@angular/forms';

@Component({
    selector: 'app-chat-sidebar',
    imports: [ NgbOffcanvasModule, SimplebarAngularModule, NgIcon, FormsModule],
    template: `
        <div class="card h-100 mb-0 border-end-0 rounded-end-0">
            <div class="card-header p-3 border-light card-bg d-block">
                <div class="d-flex gap-2">
                    <div class="app-search flex-grow-1">
                        <input [(ngModel)]="searchText" type="text" class="form-control bg-light-subtle border-light"
                               placeholder="Ara..."/>
                        <ng-icon name="tablerSearch" class="app-search-icon text-muted fs-xl"/>
                    </div>
                    <div class="dropdown" [class.show]="showFilterDropdown">
                        <button type="button" class="btn btn-dark btn-icon" (click)="toggleFilterDropdown()">
                            <ng-icon name="tablerFilter" class="fs-xl"/>
                        </button>
                        <div class="dropdown-menu p-3" [class.show]="showFilterDropdown" style="min-width: 200px;">
                            <label class="form-label mb-1">Mesaj Durumu</label>
                            <select class="form-select" [(ngModel)]="filterReadStatus">
                                <option value="all">Tümü</option>
                                <option value="unread">Okunmamış</option>
                                <option value="read">Okunmuş</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <ngx-simplebar style="height: calc(100% - 100px);">
                <div class="card-body p-2 w-100">
                    <div class="list-group list-group-flush chat-list">
                        @for (user of getFilteredUsers(); track user.id) {
                            <a
                                href="javascript:void(0)"
                                [class.active]="user.id === activeChatId"
                                (click)="selectChat(user.id)"
                                class="list-group-item list-group-item-action d-flex gap-2 justify-content-between"
                            >
                           <span class="d-flex justify-content-start align-items-center gap-2 overflow-hidden">
                               @if (!user.avatar) {
                                   <span
                                       class="avatar-sm flex-shrink-0">
                                    <span class="avatar-title text-bg-primary fw-bold rounded-circle">
                                       {{ generateInitials(user.name) }}
                                    </span>
                                </span>
                               }
                               @if (user.avatar) {
                                   <span class="avatar avatar-sm flex-shrink-0">
                                <img [src]="user.avatar" alt="avatar" class="img-fluid rounded-circle"/>
                              </span>
                               }
                               <span class="overflow-hidden">
                                <span class="text-nowrap fw-semibold fs-base mb-0 lh-base">{{ user.name }}</span>
                                <span class="text-muted d-block fs-xs mb-0 text-truncate">{{ user.lastMessage }}</span>
                              </span>
                            </span>
                                <span
                                    class="d-flex flex-column gap-1 justify-content-center flex-shrink-0 align-items-end">
                                  <span class="text-muted fs-xs">{{ user.time }}</span>
                                    @if (user.unread) {
                                        <span
                                              class="badge text-bg-primary fs-xxs">{{ user.unread }}</span>
                                    }
                                </span>
                            </a>
                        }
                    </div>
                </div>
            </ngx-simplebar>
        </div>
    `,
    styles: ``
})
export class ChatSidebar {
    constructor(public chatService: ChatService, @Optional() public activeOffcanvas: NgbActiveOffcanvas) {
    }

    searchText: string = '';
    showFilterDropdown: boolean = false;
    filterReadStatus: string = 'all';

    getFilteredUsers(): any[] {
        let users = this.chatService.getUsers();
        if (this.filterReadStatus === 'unread') {
            users = users.filter(user => user.unread && user.unread > 0);
        } else if (this.filterReadStatus === 'read') {
            users = users.filter(user => !user.unread || user.unread === 0);
        }
        if (!this.searchText) return users;
        const keyword = this.searchText.toLowerCase();
        return users.filter(user =>
            user.name.toLowerCase().includes(keyword)
        );
    }

    toggleFilterDropdown() {
        this.showFilterDropdown = !this.showFilterDropdown;
    }

    @Input() activeChatId = '';
    @Output() select = new EventEmitter<string>();

    selectChat(id: string) {
        this.select.emit(id);
    }

    protected readonly generateInitials = generateInitials;
}
