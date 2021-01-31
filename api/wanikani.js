const API_WANIKANI = process.env.NEXT_PUBLIC_API_WANIKANI;

export async function getAssignments(code, key) {
    const url = API_WANIKANI + '/assignments?subject_types=vocabulary,kanji&started=true'
    var myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${key}`);

    let rep = await fetch(
        url,
        {
            method: 'GET'
            headers: myHeaders
        }
    );
    let response = await rep.json();
    return response.data;
}