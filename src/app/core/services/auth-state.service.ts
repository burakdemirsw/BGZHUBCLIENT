import { Injectable } from '@angular/core';

export interface UserProfile {
  userId : string;
  name: string;
  surname: string;
  lastLoginDate: string;
  companyId: string;
}

const PROFILE_KEY = 'userProfile';

@Injectable({  
  providedIn: 'root',
})
export class AuthStateService {
  private _profile: UserProfile | null = null;

  get profile(): UserProfile | null {
    if (!this._profile) {
      this.loadFromStorage();
    }
    return this._profile;
  }

  /** Kullanıcı adı soyadı birleşik */
  get fullName(): string {
    return this._profile ? `${this._profile.name} ${this._profile.surname}` : '';
  }

  /** Baş harfler (avatar yerine) */
  get initials(): string {
    if (!this._profile) return '';
    const n = this._profile.name?.charAt(0) ?? '';
    const s = this._profile.surname?.charAt(0) ?? '';
    return (n + s).toUpperCase();
  }

  /** Login sonrası profili kaydet */
  setProfile(profile: UserProfile): void {
    this._profile = profile;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }

  /** Logout'ta profili temizle */
  clearProfile(): void {
    this._profile = null;
    localStorage.removeItem(PROFILE_KEY);
  }

  /** localStorage'dan yükle (sayfa yenileme) */
  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        this._profile = JSON.parse(raw) as UserProfile;
      }
    } catch {
      this._profile = null;
    }
  }
}
