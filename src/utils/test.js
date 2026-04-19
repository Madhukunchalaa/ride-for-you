const testFunction = async ()=>{
    try{
        const api = await fetch("http://localhost:5000/api/customers")
        const apiData = await api.json()
        console.log(apiData)
    }
    catch(err){
        console.log('data fetch failed')
        console.log(err)
    }
}
testFunction()