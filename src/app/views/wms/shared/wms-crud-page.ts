import { Directive } from '@angular/core';
import { WmsListPage } from './wms-list-page';

/**
 * Modal üzerinden oluştur/düzenle/sil yapan WMS sayfalarının temeli.
 *
 * `WmsListPage`'in liste ve sayfalama yeteneklerine kayıt formunu ekler.
 * Alt sınıf yalnızca formun nasıl doldurulup nasıl gönderileceğini tanımlar;
 * modal yönetimi, kaydetme akışı, silme onayı ve satır içi Aktif/Pasif
 * switch'i burada tek yerde çözülür.
 */
@Directive()
export abstract class WmsCrudPage<T extends { id: string }, TForm extends object> extends WmsListPage<T> {
    saving = false;

    /** Modal açılırken `emptyForm()` veya `toForm()` ile doldurulur */
    form: TForm = {} as TForm;

    /** Yeni kayıt formunun başlangıç değerleri */
    protected abstract emptyForm(): TForm;

    /** Mevcut kaydı form modeline çevirir */
    protected abstract toForm(item: T): TForm;

    /** Silme onayında ve mesajlarda gösterilecek kayıt adı */
    protected abstract entityLabel(item: T): string;

    protected abstract createItem(form: TForm): Promise<unknown>;
    protected abstract updateItem(id: string, form: TForm): Promise<unknown>;
    protected abstract deleteRequest(id: string): Promise<unknown>;

    /** Kaydet butonunun etkin olma koşulu */
    abstract get isFormValid(): boolean;

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = this.emptyForm();
        this.showModal = true;
    }

    openEdit(item: T): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = this.toForm(item);
        this.showModal = true;
    }

    async save(): Promise<void> {
        if (!this.isFormValid || this.saving) return;
        this.saving = true;
        try {
            if (this.editMode && this.selectedItem) {
                await this.updateItem(this.selectedItem.id, this.form);
            } else {
                await this.createItem(this.form);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err) {
            console.error('WMS kaydetme hatası:', err);
            alert('İşlem hatası: ' + this.errorMessage(err));
        } finally {
            this.saving = false;
        }
    }

    async deleteItem(item: T): Promise<void> {
        if (!confirm(`"${this.entityLabel(item)}" kaydını silmek istediğinize emin misiniz?`)) return;
        try {
            await this.deleteRequest(item.id);
            await this.loadItems();
        } catch (err) {
            console.error('WMS silme hatası:', err);
            alert('Silme hatası: ' + this.errorMessage(err));
        }
    }

    /**
     * Satır içi Aktif/Pasif switch'i — kaydın diğer alanları `toForm()` ile
     * korunur, yalnızca `isActive` tersine çevrilip güncellenir.
     * `isActive` alanı olmayan kaynaklarda kullanılmaz.
     */
    async toggleActive(item: T): Promise<void> {
        const record = item as T & { isActive: boolean };
        const nextActive = !record.isActive;
        const form = { ...this.toForm(item), isActive: nextActive } as TForm;
        await this.toggleWith(
            item,
            () => this.updateItem(item.id, form),
            () => (record.isActive = nextActive),
        );
    }
}
