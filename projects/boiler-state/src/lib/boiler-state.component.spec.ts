import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoilerStateComponent } from './boiler-state.component';

describe('BoilerStateComponent', () => {
  let component: BoilerStateComponent;
  let fixture: ComponentFixture<BoilerStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BoilerStateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoilerStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
