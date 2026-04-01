import { Button } from './components/Button';
import { StoreList } from './features/store/components/StoreList/StoreList';

function App() {
  return (
    <div>
      <div>
        <h1>CENTRA - Panel de Control</h1>
        <StoreList />
        <Button action={()=>{}} label='Enviar'/>
      </div>
    </div>
  );
}

export default App;
