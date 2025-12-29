/**
 * A wrapper function around fetch. Intended to be used to fetch entities from other services.
 * @param serviceEndpointUrl
 * @returns the endpoints response or undefined
 */

async function fetchFromService(serviceEndpointUrl) {
    const fetch = (await import('node-fetch')).default; // This is utter dogshit. Why have an import syntax that works only for some files?

    // fetch data
    const response = await fetch(`${serviceEndpointUrl}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
        return null;
    }

    return await response.json();
}

module.exports = {fetchFromService}