import { useState } from 'react';
import BottomSheet from './BottomSheet';

const CATEGORIES = [
  {
    name: 'Profession',
    positions: ['Doctor', 'Engineer', 'Teacher', 'Artist', 'Lawyer']
  },
  {
    name: 'Activity',
    positions: ['Cyclist', 'Runner', 'Gamer', 'Photographer', 'Musician']
  },
  {
    name: 'Service',
    positions: ['Plumber', 'Electrician', 'Chef', 'Driver', 'Cleaner']
  }
];

export default function CategorySelector() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const handleCategoryClick = (cat) => {
    setSelectedCategory(cat);
  };

  const handlePositionClick = (pos) => {
    setSelectedPosition(pos);
    setSheetOpen(false);
  };

  return (
    <div>
      <button onClick={() => setSheetOpen(true)} style={{padding: '12px 24px', fontSize: 18, borderRadius: 8, background: '#4caf50', color: '#fff', border: 'none'}}>Select Category</button>
      {selectedCategory && <div style={{marginTop: 16}}>Category: <b>{selectedCategory.name}</b></div>}
      {selectedPosition && <div style={{marginTop: 8}}>Position: <b>{selectedPosition}</b></div>}
      <BottomSheet open={sheetOpen} onClose={() => { setSheetOpen(false); setSelectedCategory(null); }} title={selectedCategory ? selectedCategory.name : 'Select a Category'}>
        {!selectedCategory ? (
          <div>
            {CATEGORIES.map(cat => (
              <div key={cat.name} style={{padding: 16, borderBottom: '1px solid #eee', cursor: 'pointer'}} onClick={() => handleCategoryClick(cat)}>{cat.name}</div>
            ))}
          </div>
        ) : (
          <div>
            {selectedCategory.positions.map(pos => (
              <div key={pos} style={{padding: 16, borderBottom: '1px solid #eee', cursor: 'pointer'}} onClick={() => handlePositionClick(pos)}>{pos}</div>
            ))}
            <div style={{padding: 16, color: '#4caf50', cursor: 'pointer'}} onClick={() => setSelectedCategory(null)}>← Back to Categories</div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
