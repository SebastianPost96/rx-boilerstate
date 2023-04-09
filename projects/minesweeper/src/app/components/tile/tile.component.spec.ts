import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TileComponent } from './tile.component';
import { TileImagePipe } from '../../pipes/tile-image.pipe';

describe('TileComponent', () => {
  let component: TileComponent;
  let fixture: ComponentFixture<TileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TileComponent, TileImagePipe],
    }).compileComponents();

    fixture = TestBed.createComponent(TileComponent);
    component = fixture.componentInstance;
    component.tile = { isFlagged: false, isMine: false, location: { x: 0, y: 0 }, revealed: false };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
