import InputField from './components/InputField/InputField';
import { StoreList } from './features/store/components/StoreList/StoreList';
import InputPassword from './components/InputPassword/InputPassword';

function App() {
  return (
    <div>
      <div>
        <h1>CENTRA - Panel de Control</h1>

        <InputField
          name="test"
          label="Usario"
          required={true}
          error={{ status: true, message: 'test' }}
        />

        <InputPassword name="password" label="Password" required />

        <StoreList />
      </div>
    </div>
  );
}

export default App;
