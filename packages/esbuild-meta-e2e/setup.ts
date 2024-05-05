


export default function() {
  console.log('Setup')
  return () => {
    console.log('Teardown')
  }
}
