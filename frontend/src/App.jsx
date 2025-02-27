import React from 'react';
import '@/styles/App.css';
import AppHeader from '@/components/common/AppHeader';
import AppRouter from '@/components/common/AppRouter';
import AppFooter from '@/components/common/AppFooter';

function App() {
  return (
    <React.Fragment>
      <AppHeader/>
      <AppRouter/>
      <AppFooter/>
    </React.Fragment>
  )
}

export default App
