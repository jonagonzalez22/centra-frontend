import InputField from './components/InputField/InputField';
import InputPassword from './components/InputPassword/InputPassword';
import { TailwindAntdSmokeTest } from './components/TailwindAntdSmokeTest/TailwindAntdSmokeTest';
import { StoreList } from './features/store/components/StoreList/StoreList';

function App() {
  return (
    <div>
      <div>
        <h1>CENTRA - Panel de Control</h1>

        <TailwindAntdSmokeTest />

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
